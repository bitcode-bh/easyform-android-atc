package com.sky.atc.easyformse.upload;

import org.junit.Test;

import java.io.EOFException;
import java.io.File;
import java.io.FileNotFoundException;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.fail;

public class UploadChunkReaderTest {
    @Test
    public void concurrentFilesKeepTheirOwnChunkPositions() throws Exception {
        byte[] first = new byte[1024 * 1024 + 97];
        byte[] second = new byte[1024 * 1024 + 151];
        for (int i = 0; i < first.length; i++) first[i] = (byte) (i % 251);
        for (int i = 0; i < second.length; i++) second[i] = (byte) (i % 239);
        File a = File.createTempFile("upload-a", ".bin");
        File b = File.createTempFile("upload-b", ".bin");
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Files.write(a.toPath(), first);
            Files.write(b.toPath(), second);
            Future<?> taskA = pool.submit(() -> checkChunks(a, first));
            Future<?> taskB = pool.submit(() -> checkChunks(b, second));
            taskA.get();
            taskB.get();
        } finally {
            pool.shutdownNow();
            Files.deleteIfExists(a.toPath());
            Files.deleteIfExists(b.toPath());
        }
    }

    private void checkChunks(File file, byte[] contents) {
        try {
            for (int i = 0; i < 20; i++) {
                int boundary = 1024 * 1024;
                assertArrayEquals(Arrays.copyOfRange(contents, 0, boundary),
                        UploadChunkReader.read(file, 0, boundary));
                assertArrayEquals(Arrays.copyOfRange(contents, boundary, contents.length),
                        UploadChunkReader.read(file, boundary, contents.length - boundary));
            }
        } catch (Exception e) {
            throw new AssertionError(e);
        }
    }

    @Test
    public void missingAndTruncatedFilesFailInsteadOfReturningPartialChunks() throws Exception {
        File file = File.createTempFile("upload", ".bin");
        try {
            Files.write(file.toPath(), new byte[] { 1, 2, 3 });
            try {
                UploadChunkReader.read(file, 0, 4);
                fail("truncated chunk accepted");
            } catch (EOFException expected) { }
            Files.delete(file.toPath());
            try {
                UploadChunkReader.read(file, 0, 1);
                fail("missing file accepted");
            } catch (FileNotFoundException expected) { }
        } finally {
            Files.deleteIfExists(file.toPath());
        }
    }
}
