const identityState = (response) => response?.Identity?.status?.state || response?.status?.state || null

const submitLegalEvidence = async ({ legalId, getIdentity, uploadAttachments, readyForApproval }) => {
  if (identityState(await getIdentity(legalId)) === 'Approved') return

  try {
    await uploadAttachments()
    await readyForApproval()
  } catch (error) {
    // Some sandbox reviewers approve while evidence is being submitted.
    try {
      if (identityState(await getIdentity(legalId)) === 'Approved') return
    } catch {}
    throw error
  }
}

export { identityState, submitLegalEvidence }
