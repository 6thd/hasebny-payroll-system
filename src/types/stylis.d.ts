declare module 'stylis' {
  export function prefixer(element: any, index: number, children: any[], callback: any): any;
  export function middleware(plugin: any): any;
  // Add other exports as needed
}

// Or for a simpler approach that just removes the error:
// declare module 'stylis';