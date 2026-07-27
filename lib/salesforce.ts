import { SalesforceAccount } from '@/types';

let _accessToken: string | null = null;
let _tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  if (_accessToken && Date.now() < _tokenExpiry) return _accessToken;

  const params = new URLSearchParams({
    grant_type: 'password',
    client_id: process.env.SALESFORCE_CLIENT_ID!,
    client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
    username: process.env.SALESFORCE_USERNAME!,
    password: `${process.env.SALESFORCE_PASSWORD}${process.env.SALESFORCE_SECURITY_TOKEN}`,
  });

  const res = await fetch(
    `${process.env.SALESFORCE_INSTANCE_URL}/services/oauth2/token`,
    { method: 'POST', body: params }
  );

  if (!res.ok) throw new Error('Salesforce auth failed');
  const data = await res.json();
  _accessToken = data.access_token;
  _tokenExpiry = Date.now() + 3600 * 1000;
  return _accessToken!;
}

export async function findAccountByEmail(email: string): Promise<SalesforceAccount | null> {
  const token = await getAccessToken();
  const instanceUrl = process.env.SALESFORCE_INSTANCE_URL!;

  // Try to find a Contact with this email, then get their Account
  const contactQuery = `SELECT AccountId, Account.Id, Account.Name, Account.Next_Upcoming_Renewal__c, Account.Next_Step_CS__c, Account.CS_Next_Step_History__c FROM Contact WHERE Email = '${email}' LIMIT 1`;
  const encodedQuery = encodeURIComponent(contactQuery);

  const res = await fetch(
    `${instanceUrl}/services/data/v58.0/query?q=${encodedQuery}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) return null;
  const data = await res.json();

  if (data.records?.length > 0) {
    const acct = data.records[0].Account;
    return {
      id: acct.Id,
      name: acct.Name,
      renewalDate: acct.Next_Upcoming_Renewal__c,
      nextStep: acct.Next_Step_CS__c,
      nextStepHistory: acct.CS_Next_Step_History__c,
    };
  }

  // Fallback: match by domain
  const domain = email.split('@')[1];
  if (!domain) return null;

  const domainQuery = `SELECT Id, Name, Next_Upcoming_Renewal__c, Next_Step_CS__c, CS_Next_Step_History__c FROM Account WHERE Website LIKE '%${domain}%' LIMIT 1`;
  const encodedDomain = encodeURIComponent(domainQuery);

  const domainRes = await fetch(
    `${instanceUrl}/services/data/v58.0/query?q=${encodedDomain}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!domainRes.ok) return null;
  const domainData = await domainRes.json();

  if (domainData.records?.length > 0) {
    const acct = domainData.records[0];
    return {
      id: acct.Id,
      name: acct.Name,
      renewalDate: acct.Next_Upcoming_Renewal__c,
      nextStep: acct.Next_Step_CS__c,
      nextStepHistory: acct.CS_Next_Step_History__c,
    };
  }

  return null;
}

export async function findAccountForEvent(
  externalEmails: string[]
): Promise<SalesforceAccount | null> {
  for (const email of externalEmails) {
    const account = await findAccountByEmail(email);
    if (account) return account;
  }
  return null;
}
