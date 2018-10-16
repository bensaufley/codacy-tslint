//#Patterns: adjacent-overload-signatures

interface MyInterface {
  (x: string): void;
  myParameter: string;
  //#Warn: adjacent-overload-signatures
  (x: number): number;
}
