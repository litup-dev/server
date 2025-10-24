export interface IStorageAdapter {
    /**
     * 파일을 저장합니다
     * @param buffer 파일 버퍼
     * @param filePath 저장할 파일 경로 (예: "avatar/123/20251023143055_uuid.jpg")
     * @returns 저장된 파일의 전체 경로
     */
    save(buffer: Buffer, filePath: string): Promise<string>;

    /**
     * 파일을 삭제합니다
     * @param filePath 삭제할 파일 경로
     * @return 삭제 작업이 완료되면 void를 반환합니다
     */
    delete(filePath: string): Promise<void>;

    /**
     * 폴더를 삭제합니다
     * @param folderPath 삭제할 폴더 경로
     * @return 삭제 작업이 완료되면 void를 반환합니다
     */
    deleteFolder(folderPath: string): Promise<void>;

    /**
     * 파일이 존재하는지 확인합니다
     * @param filePath 확인할 파일 경로
     * @return 파일이 존재하면 true, 그렇지 않으면 false
     */
    exists(filePath: string): Promise<boolean>;
}
