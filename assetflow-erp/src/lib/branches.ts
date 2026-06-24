export const DEFAULT_BRANCH = "Head Office"

export const BRANCH_OPTIONS = [
  DEFAULT_BRANCH,
  "Engineering Branch",
  "Design Branch",
  "Warehouse",
  "Fleet Yard",
  "Lab Branch",
]

export function normalizeBranch(branch?: string | null) {
  return branch?.trim() || "Unassigned"
}

export function getBranchOptions(values: Array<string | undefined | null>) {
  const branches = new Set(BRANCH_OPTIONS)
  let hasUnassigned = false
  values.forEach((value) => {
    const branch = value?.trim()
    if (branch) branches.add(branch)
    else hasUnassigned = true
  })
  if (hasUnassigned) branches.add("Unassigned")
  return Array.from(branches).sort((a, b) => a.localeCompare(b))
}
