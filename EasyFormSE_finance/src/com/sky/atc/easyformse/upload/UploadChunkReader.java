package com.sky.atc.easyformse.upload;

import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;

/** Reads a complete chunk without sharing upload position or file handles. */
public final class UploadChunkReader {
    private UploadChunkReader() { }

    public static byte[] read(File file, long offset, int length) throws IOException {
        byte[] chunk = new byte[length];
        try (RandomAccessFile input = new RandomAccessFile(file, "r")) {
            input.seek(offset);
            input.readFully(chunk);
        }
        return chunk;
    }
}
