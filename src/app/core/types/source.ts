export interface SourceFileHandle {
    name: string;
    getFile(): Promise<File>;
    queryPermission?(descriptor: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
    requestPermission?(descriptor: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
}

export interface FilePickerWindow {
    showOpenFilePicker?(options?: { multiple?: boolean; types?: { description?: string; accept: Record<string, string[]> }[] }): Promise<SourceFileHandle[]>;
}
