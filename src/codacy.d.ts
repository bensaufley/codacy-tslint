export interface CodacyPattern {
  patternId: string;
  parameters: {
    name: string;
    value: boolean | string;
  }[];
}

export interface CodacyTool {
  name: string;
  patterns: CodacyPattern[];
}

export interface CodacyConfig {
  files?: string[];
  tools?: CodacyTool[];
}
