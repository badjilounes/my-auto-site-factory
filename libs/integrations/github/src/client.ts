import { Octokit } from '@octokit/rest';
import { getTemplateFiles } from './templates';

// ── Types ────────────────────────────────────────────────────────────────────

export interface RepoInfo {
  owner: string;
  name: string;
  fullName: string;
  htmlUrl: string;
  cloneUrl: string;
  defaultBranch: string;
}

export interface CommitResult {
  sha: string;
  url: string;
  filesCount: number;
}

export interface PullRequestResult {
  number: number;
  merged: boolean;
  mergeCommitSha: string | null;
  htmlUrl: string;
}

export interface CreateRepoOptions {
  /** Repository description */
  description?: string;
  /** Private repo (default: false — public for Vercel free tier) */
  isPrivate?: boolean;
  /** Business name for README template */
  businessName?: string;
  /** City for README template */
  city?: string;
}

// ── Client ───────────────────────────────────────────────────────────────────

let octokit: Octokit | null = null;
let cachedOwner: string | null = null;

function getOctokit(): Octokit {
  if (!octokit) {
    const token = process.env['GITHUB_TOKEN'];
    if (!token) throw new Error('GITHUB_TOKEN environment variable is required');
    octokit = new Octokit({ auth: token });
  }
  return octokit;
}

async function resolveOwner(explicitOwner?: string): Promise<string> {
  if (explicitOwner) return explicitOwner;
  if (cachedOwner) return cachedOwner;
  const { data } = await getOctokit().users.getAuthenticated();
  cachedOwner = data.login;
  return cachedOwner;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Create a new GitHub repository and push all site files in a single commit.
 *
 * This is the main function used by the site-generator worker.
 * It combines:
 * 1. Create the repo (with auto_init for a default README)
 * 2. Inject template files (.gitignore, vercel.json, README.md)
 * 3. Push all generated site files in one atomic commit
 *
 * @param owner - GitHub username or org (if omitted, uses authenticated user)
 * @param name - Repository name (e.g., "site-pizza-napoli-paris")
 * @param files - Generated site files from Claude (path → content)
 * @param options - Additional options (description, private, etc.)
 * @returns Repo info + commit SHA
 */
export async function createRepoFromCode(
  owner: string,
  name: string,
  files: Record<string, string>,
  options?: CreateRepoOptions,
): Promise<RepoInfo & { commitSha: string }> {
  const kit = getOctokit();
  const resolvedOwner = await resolveOwner(owner);

  // Step 1: Create the repository
  const repo = await createRepository(resolvedOwner, name, {
    description: options?.description,
    isPrivate: options?.isPrivate,
  });

  // Step 2: Wait for GitHub to initialize the repo (auto_init)
  await sleep(1500);

  // Step 3: Merge template files with generated files (generated files take precedence)
  const templateFiles = getTemplateFiles(
    options?.businessName ?? name,
    options?.city ?? '',
  );
  const allFiles: Record<string, string> = { ...templateFiles, ...files };

  // Step 4: Push everything in one commit
  const commit = await commitAndPush(
    resolvedOwner,
    name,
    repo.defaultBranch,
    allFiles,
    'feat: initial site generation',
  );

  return { ...repo, commitSha: commit.sha };
}

/**
 * Create an empty GitHub repository.
 */
export async function createRepository(
  owner: string,
  name: string,
  options?: { description?: string; isPrivate?: boolean },
): Promise<RepoInfo> {
  const kit = getOctokit();
  const resolvedOwner = await resolveOwner(owner);

  try {
    const { data } = await kit.repos.createForAuthenticatedUser({
      name,
      description: options?.description ?? `Site vitrine généré par MonSiteVitrine`,
      private: options?.isPrivate ?? false,
      auto_init: true, // Creates default branch with initial commit
      gitignore_template: undefined, // We push our own .gitignore
    });

    return {
      owner: resolvedOwner,
      name: data.name,
      fullName: data.full_name,
      htmlUrl: data.html_url,
      cloneUrl: data.clone_url,
      defaultBranch: data.default_branch ?? 'main',
    };
  } catch (error) {
    // If repo already exists, fetch its info
    if (isGitHubError(error) && error.status === 422) {
      const { data } = await kit.repos.get({ owner: resolvedOwner, repo: name });
      return {
        owner: resolvedOwner,
        name: data.name,
        fullName: data.full_name,
        htmlUrl: data.html_url,
        cloneUrl: data.clone_url,
        defaultBranch: data.default_branch ?? 'main',
      };
    }
    throw wrapError(`Failed to create repository "${name}"`, error);
  }
}

/**
 * Commit and push files to a branch using the Git Tree API.
 *
 * Creates blobs for each file, builds a tree, creates a commit,
 * and updates the branch ref — all via the GitHub API (no git clone needed).
 *
 * @param owner - Repo owner
 * @param repo - Repo name
 * @param branch - Target branch (e.g., "main" or "feature/update-site")
 * @param files - Files to commit (path → content)
 * @param message - Commit message
 * @returns Commit SHA and URL
 */
export async function commitAndPush(
  owner: string,
  repo: string,
  branch: string,
  files: Record<string, string>,
  message: string,
): Promise<CommitResult> {
  const kit = getOctokit();
  const resolvedOwner = await resolveOwner(owner);

  // Get the current HEAD of the branch
  let headSha: string;
  try {
    const { data: refData } = await kit.git.getRef({
      owner: resolvedOwner,
      repo,
      ref: `heads/${branch}`,
    });
    headSha = refData.object.sha;
  } catch (error) {
    // Branch doesn't exist — create it from default branch
    const { data: repoData } = await kit.repos.get({ owner: resolvedOwner, repo });
    const defaultBranch = repoData.default_branch ?? 'main';
    const { data: defaultRef } = await kit.git.getRef({
      owner: resolvedOwner,
      repo,
      ref: `heads/${defaultBranch}`,
    });
    headSha = defaultRef.object.sha;

    // Create the new branch
    await kit.git.createRef({
      owner: resolvedOwner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: headSha,
    });
  }

  // Get the base tree
  const { data: commitData } = await kit.git.getCommit({
    owner: resolvedOwner,
    repo,
    commit_sha: headSha,
  });
  const baseTreeSha = commitData.tree.sha;

  // Create blobs in parallel (batched to avoid rate limits)
  const entries = Object.entries(files);
  const BATCH_SIZE = 10;
  const treeItems: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const blobResults = await Promise.all(
      batch.map(async ([path, content]) => {
        const { data: blob } = await kit.git.createBlob({
          owner: resolvedOwner,
          repo,
          content: Buffer.from(content).toString('base64'),
          encoding: 'base64',
        });
        return { path, mode: '100644' as const, type: 'blob' as const, sha: blob.sha };
      }),
    );
    treeItems.push(...blobResults);
  }

  // Create the tree
  const { data: newTree } = await kit.git.createTree({
    owner: resolvedOwner,
    repo,
    base_tree: baseTreeSha,
    tree: treeItems,
  });

  // Create the commit
  const { data: newCommit } = await kit.git.createCommit({
    owner: resolvedOwner,
    repo,
    message,
    tree: newTree.sha,
    parents: [headSha],
  });

  // Update the branch ref
  await kit.git.updateRef({
    owner: resolvedOwner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
  });

  return {
    sha: newCommit.sha,
    url: newCommit.html_url,
    filesCount: entries.length,
  };
}

/**
 * Create a pull request and optionally merge it immediately.
 *
 * Used when pushing to a feature branch and wanting to merge into main
 * (e.g., for site updates after initial generation).
 *
 * @param owner - Repo owner
 * @param repo - Repo name
 * @param options - PR title, branches, body, auto-merge, etc.
 */
export async function createAndMergePR(
  owner: string,
  repo: string,
  options: {
    title: string;
    head: string;
    base?: string;
    body?: string;
    autoMerge?: boolean;
    deleteBranchAfterMerge?: boolean;
  },
): Promise<PullRequestResult> {
  const kit = getOctokit();
  const resolvedOwner = await resolveOwner(owner);
  const base = options.base ?? 'main';

  // Create the PR
  const { data: pr } = await kit.pulls.create({
    owner: resolvedOwner,
    repo,
    title: options.title,
    head: options.head,
    base,
    body: options.body ?? `Mise à jour automatique du site vitrine.\n\nGénéré par MonSiteVitrine.`,
  });

  let merged = false;
  let mergeCommitSha: string | null = null;

  // Auto-merge if requested (default: true)
  if (options.autoMerge !== false) {
    try {
      // Small delay to let GitHub process the PR
      await sleep(1000);

      const { data: mergeResult } = await kit.pulls.merge({
        owner: resolvedOwner,
        repo,
        pull_number: pr.number,
        merge_method: 'squash',
        commit_title: options.title,
      });

      merged = mergeResult.merged;
      mergeCommitSha = mergeResult.sha;
    } catch (error) {
      // Merge might fail if there are conflicts — that's OK, PR is still open
      console.warn(
        `Auto-merge failed for PR #${pr.number}: ${error instanceof Error ? error.message : error}`,
      );
    }

    // Delete the branch after merge if requested (default: true)
    if (merged && options.deleteBranchAfterMerge !== false) {
      try {
        await kit.git.deleteRef({
          owner: resolvedOwner,
          repo,
          ref: `heads/${options.head}`,
        });
      } catch {
        // Branch deletion is best-effort
      }
    }
  }

  return {
    number: pr.number,
    merged,
    mergeCommitSha,
    htmlUrl: pr.html_url,
  };
}

/**
 * Delete a repository. Use with caution.
 */
export async function deleteRepository(owner: string, repo: string): Promise<void> {
  const kit = getOctokit();
  const resolvedOwner = await resolveOwner(owner);
  await kit.repos.delete({ owner: resolvedOwner, repo });
}

/**
 * Check if a repository exists.
 */
export async function repoExists(owner: string, repo: string): Promise<boolean> {
  const kit = getOctokit();
  const resolvedOwner = await resolveOwner(owner);
  try {
    await kit.repos.get({ owner: resolvedOwner, repo });
    return true;
  } catch {
    return false;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isGitHubError(error: unknown): error is { status: number; message: string } {
  return typeof error === 'object' && error !== null && 'status' in error;
}

function wrapError(context: string, error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  return new Error(`${context}: ${message}`);
}
