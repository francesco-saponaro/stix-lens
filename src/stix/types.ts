/** The subset of STIX 2.1 this tool reads. Unknown properties are kept but not typed. */

export type StixId = `${string}--${string}`;

export interface StixCommon {
  type: string;
  id: StixId;
  spec_version?: "2.1";
  created: string;
  modified: string;
  created_by_ref?: StixId;
  name?: string;
  description?: string;
  labels?: string[];
  external_references?: ExternalReference[];
  object_marking_refs?: StixId[];
  [key: string]: unknown;
}

export interface ExternalReference {
  source_name: string;
  external_id?: string;
  url?: string;
}

export interface KillChainPhase {
  kill_chain_name: string;
  phase_name: string;
}

export interface AttackPattern extends StixCommon {
  type: "attack-pattern";
  name: string;
  kill_chain_phases?: KillChainPhase[];
}

export interface IntrusionSet extends StixCommon {
  type: "intrusion-set";
  name: string;
  aliases?: string[];
  first_seen?: string;
  last_seen?: string;
}

export interface Malware extends StixCommon {
  type: "malware";
  name: string;
  is_family: boolean;
  malware_types?: string[];
}

export interface Tool extends StixCommon {
  type: "tool";
  name: string;
}

export interface Indicator extends StixCommon {
  type: "indicator";
  pattern: string;
  pattern_type: "stix";
  valid_from: string;
  valid_until?: string;
  indicator_types?: string[];
}

export interface Identity extends StixCommon {
  type: "identity";
  name: string;
  identity_class: string;
  sectors?: string[];
}

export interface Report extends StixCommon {
  type: "report";
  name: string;
  published: string;
  report_types?: string[];
  object_refs: StixId[];
}

export interface Relationship extends StixCommon {
  type: "relationship";
  relationship_type: string;
  source_ref: StixId;
  target_ref: StixId;
}

export type StixObject =
  | AttackPattern
  | IntrusionSet
  | Malware
  | Tool
  | Indicator
  | Identity
  | Report
  | Relationship
  | StixCommon;

export interface Bundle {
  type: "bundle";
  id: StixId;
  objects: StixObject[];
}

export function isRelationship(o: StixObject): o is Relationship {
  return o.type === "relationship";
}

export function isIndicator(o: StixObject): o is Indicator {
  return o.type === "indicator";
}

export function isReport(o: StixObject): o is Report {
  return o.type === "report";
}

export function isAttackPattern(o: StixObject): o is AttackPattern {
  return o.type === "attack-pattern";
}
