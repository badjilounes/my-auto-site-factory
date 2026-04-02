import { Octokit } from '@octokit/rest';

export interface GitHubFile {
  path: string;
  content: string;
}

export class GitHubIntegration {
  private octokit: Octokit;
  private owner: string;

  constructor(token: string, owner?: string) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner ?? '';
  }

  private async resolveOwner(): Promise<string> {
    if (this.owner) return this.owner;
    const { data } = await this.octokit.users.getAuthenticated();
    this.owner = data.login;
    return this.owner;
  }

  async createRepository(
    name: string,
    description: string,
    isPrivate: boolean
  ): Promise<{ fullName: string; htmlUrl: string; cloneUrl: string }> {
    try {
      const { data } = await this.octokit.repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate,
        auto_init: true,
      });

      return {
        fullName: data.full_name,
        htmlUrl: data.html_url,
        cloneUrl: data.clone_url,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create repository "${name}": ${message}`);
    }
  }

  async pushCode(
    repoName: string,
    files: GitHubFile[]
  ): Promise<{ commitSha: string }> {
    try {
      const owner = await this.resolveOwner();

      // Get the reference to the main branch
      const { data: refData } = await this.octokit.git.getRef({
        owner,
        repo: repoName,
        ref: 'heads/main',
      });
      const latestCommitSha = refData.object.sha;

      // Get the tree of the latest commit
      const { data: commitData } = await this.octokit.git.getCommit({
        owner,
        repo: repoName,
        commit_sha: latestCommitSha,
      });
      const baseTreeSha = commitData.tree.sha;

      // Create blobs for each file
      const treeItems = await Promise.all(
        files.map(async (file) => {
          const { data: blob } = await this.octokit.git.createBlob({
            owner,
            repo: repoName,
            content: Buffer.from(file.content).toString('base64'),
            encoding: 'base64',
          });

          return {
            path: file.path,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: blob.sha,
          };
        })
      );

      // Create a new tree
      const { data: newTree } = await this.octokit.git.createTree({
        owner,
        repo: repoName,
        base_tree: baseTreeSha,
        tree: treeItems,
      });

      // Create a new commit
      const { data: newCommit } = await this.octokit.git.createCommit({
        owner,
        repo: repoName,
        message: `Add site files (${files.length} files)`,
        tree: newTree.sha,
        parents: [latestCommitSha],
      });

      // Update the reference
      await this.octokit.git.updateRef({
        owner,
        repo: repoName,
        ref: 'heads/main',
        sha: newCommit.sha,
      });

      return { commitSha: newCommit.sha };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to push code to "${repoName}": ${message}`
      );
    }
  }

  async createAndMergePR(
    repoName: string,
    title: string,
    head: string,
    base: string
  ): Promise<{ prNumber: number; merged: boolean }> {
    try {
      const owner = await this.resolveOwner();

      // Create pull request
      const { data: pr } = await this.octokit.pulls.create({
        owner,
        repo: repoName,
        title,
        head,
        base,
      });

      // Merge the pull request
      const { data: mergeResult } = await this.octokit.pulls.merge({
        owner,
        repo: repoName,
        pull_number: pr.number,
        merge_method: 'squash',
      });

      return {
        prNumber: pr.number,
        merged: mergeResult.merged,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to create/merge PR for "${repoName}": ${message}`
      );
    }
  }
}

export function createGitHubClient(
  token: string,
  owner?: string
): GitHubIntegration {
  return new GitHubIntegration(token, owner);
}
