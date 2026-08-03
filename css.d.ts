// Allow importing CSS files in TypeScript (required by NativeWind v4)
declare module '*.css' {
  const content: string;
  export default content;
}
