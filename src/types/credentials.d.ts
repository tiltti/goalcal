// Credential Management API types
interface PasswordCredential extends Credential {
  password: string
  name?: string
  iconURL?: string
}

interface PasswordCredentialInit {
  id: string
  password: string
  name?: string
  iconURL?: string
}

declare var PasswordCredential: {
  prototype: PasswordCredential
  new(init: PasswordCredentialInit): PasswordCredential
  new(form: HTMLFormElement): PasswordCredential
}

interface CredentialRequestOptions {
  password?: boolean
  federated?: FederatedCredentialRequestOptions
  mediation?: CredentialMediationRequirement
}
