export class AuthorityGate {
  evaluate(result) {

    if (!result?.actions?.length) {
      return {
        allowed: true,
        requiresApproval: false
      };
    }

    if (result.humanApprovalRequired) {
      return {
        allowed: true,
        requiresApproval: true
      };
    }

    return {
      allowed: true,
      requiresApproval: false
    };
  }
}
