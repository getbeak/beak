// Source of truth is @beak/core/git; this re-export keeps existing UI imports working.
import { addBranch, changeSelectedBranch, gitOpened, removeBranch, startGit } from '@beak/core/git';

export { addBranch, changeSelectedBranch, gitOpened, removeBranch, startGit };
export default { addBranch, changeSelectedBranch, gitOpened, removeBranch, startGit };
