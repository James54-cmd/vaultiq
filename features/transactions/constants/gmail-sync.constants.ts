export const defaultGmailSyncBaseQuery =
  '(subject:payment OR subject:receipt OR subject:transaction OR subject:invoice OR subject:transfer OR subject:"order paid" OR subject:"payment confirmation" OR subject:"official receipt" OR "payment successful" OR "payment received" OR "you paid" OR "you sent" OR "money received" OR "fund transfer" OR "funds transfer" OR "successful transfer" OR "transfer successful" OR "transfer to your account") OR (from:gcash OR from:maya OR from:atome OR from:bpi OR from:bdo OR from:unionbank OR from:metrobank OR from:securitybank OR from:landbank OR from:seabank OR from:maribank OR from:paypal OR from:payoneer OR from:wise)';

export const defaultGmailSyncLookbackDays = 365;
export const defaultGmailSyncMaxResultsPerPage = 25;
export const defaultGmailSyncMaxPages = 10;
