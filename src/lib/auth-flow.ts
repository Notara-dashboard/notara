export const invitedOwnerEmail = "notara@mjwgroup.co.za";
export type AuthReply = {
  ok?: boolean;
  next?: string;
  sent?: boolean;
  signedIn?: boolean;
  setupRequired?: boolean;
  email?: string;
  error?: string;
};
export async function readAuthReply(response: Response): Promise<AuthReply> {
  const text = await response.text();
  let data: AuthReply;
  try {
    data = JSON.parse(text);
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new Error();
  } catch {
    throw new Error(
      "Sign-in is temporarily unavailable at this address. Please refresh or use the Notara production sign-in page.",
    );
  }
  if (!response.ok)
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Sign-in could not be completed. Please try again.",
    );
  return data;
}
