/** MITRE ATT&CK Enterprise tactics in matrix order, and the techniques the sample bundle uses. */

export const TACTICS = [
  { id: "reconnaissance", name: "Reconnaissance", short: "Recon" },
  { id: "resource-development", name: "Resource Development", short: "Resource" },
  { id: "initial-access", name: "Initial Access", short: "Initial" },
  { id: "execution", name: "Execution", short: "Exec" },
  { id: "persistence", name: "Persistence", short: "Persist" },
  { id: "privilege-escalation", name: "Privilege Escalation", short: "Priv esc" },
  { id: "defense-evasion", name: "Defense Evasion", short: "Evasion" },
  { id: "credential-access", name: "Credential Access", short: "Creds" },
  { id: "discovery", name: "Discovery", short: "Discovery" },
  { id: "lateral-movement", name: "Lateral Movement", short: "Lateral" },
  { id: "collection", name: "Collection", short: "Collect" },
  { id: "command-and-control", name: "Command and Control", short: "C2" },
  { id: "exfiltration", name: "Exfiltration", short: "Exfil" },
  { id: "impact", name: "Impact", short: "Impact" },
] as const;

export type TacticId = (typeof TACTICS)[number]["id"];

export interface Technique {
  id: string;
  name: string;
  tactics: TacticId[];
}

export const TECHNIQUES: Technique[] = [
  { id: "T1595", name: "Active Scanning", tactics: ["reconnaissance"] },
  { id: "T1598", name: "Phishing for Information", tactics: ["reconnaissance"] },
  { id: "T1583", name: "Acquire Infrastructure", tactics: ["resource-development"] },
  { id: "T1588.002", name: "Obtain Capabilities: Tool", tactics: ["resource-development"] },
  { id: "T1566.001", name: "Phishing: Spearphishing Attachment", tactics: ["initial-access"] },
  { id: "T1566.002", name: "Phishing: Spearphishing Link", tactics: ["initial-access"] },
  { id: "T1190", name: "Exploit Public-Facing Application", tactics: ["initial-access"] },
  { id: "T1078", name: "Valid Accounts", tactics: ["initial-access", "persistence", "privilege-escalation", "defense-evasion"] },
  { id: "T1059.001", name: "Command and Scripting Interpreter: PowerShell", tactics: ["execution"] },
  { id: "T1059.003", name: "Command and Scripting Interpreter: Windows Command Shell", tactics: ["execution"] },
  { id: "T1204.002", name: "User Execution: Malicious File", tactics: ["execution"] },
  { id: "T1047", name: "Windows Management Instrumentation", tactics: ["execution"] },
  { id: "T1547.001", name: "Boot or Logon Autostart Execution: Registry Run Keys", tactics: ["persistence", "privilege-escalation"] },
  { id: "T1053.005", name: "Scheduled Task/Job: Scheduled Task", tactics: ["execution", "persistence", "privilege-escalation"] },
  { id: "T1136.001", name: "Create Account: Local Account", tactics: ["persistence"] },
  { id: "T1068", name: "Exploitation for Privilege Escalation", tactics: ["privilege-escalation"] },
  { id: "T1055", name: "Process Injection", tactics: ["privilege-escalation", "defense-evasion"] },
  { id: "T1027", name: "Obfuscated Files or Information", tactics: ["defense-evasion"] },
  { id: "T1070.004", name: "Indicator Removal: File Deletion", tactics: ["defense-evasion"] },
  { id: "T1036.005", name: "Masquerading: Match Legitimate Name or Location", tactics: ["defense-evasion"] },
  { id: "T1562.001", name: "Impair Defenses: Disable or Modify Tools", tactics: ["defense-evasion"] },
  { id: "T1003.001", name: "OS Credential Dumping: LSASS Memory", tactics: ["credential-access"] },
  { id: "T1110.003", name: "Brute Force: Password Spraying", tactics: ["credential-access"] },
  { id: "T1056.001", name: "Input Capture: Keylogging", tactics: ["credential-access", "collection"] },
  { id: "T1082", name: "System Information Discovery", tactics: ["discovery"] },
  { id: "T1083", name: "File and Directory Discovery", tactics: ["discovery"] },
  { id: "T1018", name: "Remote System Discovery", tactics: ["discovery"] },
  { id: "T1087.002", name: "Account Discovery: Domain Account", tactics: ["discovery"] },
  { id: "T1021.001", name: "Remote Services: Remote Desktop Protocol", tactics: ["lateral-movement"] },
  { id: "T1021.002", name: "Remote Services: SMB/Windows Admin Shares", tactics: ["lateral-movement"] },
  { id: "T1570", name: "Lateral Tool Transfer", tactics: ["lateral-movement"] },
  { id: "T1560.001", name: "Archive Collected Data: Archive via Utility", tactics: ["collection"] },
  { id: "T1005", name: "Data from Local System", tactics: ["collection"] },
  { id: "T1114.002", name: "Email Collection: Remote Email Collection", tactics: ["collection"] },
  { id: "T1071.001", name: "Application Layer Protocol: Web Protocols", tactics: ["command-and-control"] },
  { id: "T1105", name: "Ingress Tool Transfer", tactics: ["command-and-control"] },
  { id: "T1573.002", name: "Encrypted Channel: Asymmetric Cryptography", tactics: ["command-and-control"] },
  { id: "T1090.003", name: "Proxy: Multi-hop Proxy", tactics: ["command-and-control"] },
  { id: "T1041", name: "Exfiltration Over C2 Channel", tactics: ["exfiltration"] },
  { id: "T1567.002", name: "Exfiltration Over Web Service: Exfiltration to Cloud Storage", tactics: ["exfiltration"] },
  { id: "T1486", name: "Data Encrypted for Impact", tactics: ["impact"] },
  { id: "T1489", name: "Service Stop", tactics: ["impact"] },
  { id: "T1490", name: "Inhibit System Recovery", tactics: ["impact"] },
];

export const TECHNIQUE_BY_ID = new Map(TECHNIQUES.map((t) => [t.id, t]));
