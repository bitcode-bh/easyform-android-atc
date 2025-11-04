package com.example.nitin.newcustomvideorecording;

import android.util.Log;
import android.widget.Toast;


import org.mp4parser.Container;
import org.mp4parser.muxer.FileDataSourceImpl;
import org.mp4parser.muxer.Movie;
import org.mp4parser.muxer.Track;
import org.mp4parser.muxer.builder.DefaultMp4Builder;
import org.mp4parser.muxer.container.mp4.MovieCreator;
import org.mp4parser.muxer.tracks.AppendTrack;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.channels.Channels;
import java.nio.channels.WritableByteChannel;
import java.util.ArrayList;
import java.util.List;

/**
 * @author Nikolai Doronin {@literal <lassana.nd@gmail.com>}
 * @since 8/25/13
 */
public final class Mp4ParserWrapper {

    public static final String TAG = "Mp4ParserWrapper";

    public static final int FILE_BUFFER_SIZE = 1024;


    static String dstpath;

    /**
     * Appends mp4 audios/videos: {@code anotherFileName} to {@code mainFileName}.
     */
    public static String append(ArrayList<String> pausepath) {
        boolean rvalue = false;


        String mainFileName = pausepath.get(0);
        String anotherFileName = pausepath.get(1);

        try {

            File targetFile = new File(mainFileName);
            File anotherFile = new File(anotherFileName);
            if (targetFile.exists() && targetFile.length() > 0) {

                String tmpFileName = mainFileName + ".tmp";
                append(mainFileName, pausepath, tmpFileName);
                copyFile(tmpFileName, mainFileName);
                rvalue = anotherFile.delete() && new File(tmpFileName).delete();
            } else {
                if ((targetFile.getParentFile().mkdirs()
                        && targetFile.createNewFile())
                        || targetFile.exists()) {

                    dstpath = copyFile(anotherFileName, mainFileName);
                    if (!anotherFile.equals(mainFileName)) {

                        rvalue = anotherFile.delete();
                    }

                } else {
                    rvalue = false;
                }
            }
        } catch (IOException e) {

            Log.e(TAG, "Appending two mp4 files failed with exception", e);
        }

        return mainFileName;
    }

    private static String copyFile(final String from, final String destination)
            throws IOException {

        FileInputStream in = new FileInputStream(from);
        FileOutputStream out = new FileOutputStream(destination);
        copy(in, out);
        in.close();
        out.close();

        return destination;

    }

    private static void copy(FileInputStream in, FileOutputStream out) throws IOException {
        byte[] buf = new byte[FILE_BUFFER_SIZE];
        int len;
        while ((len = in.read(buf)) > 0) {
            out.write(buf, 0, len);
        }
    }

    public static void append(
            final String firstFile, final ArrayList<String> videoList,
            final String newFile) throws IOException {

//        final Movie movieA = MovieCreator.build(new FileDataSourceImpl(secondFile));
        final Movie movieB = MovieCreator.build(String.valueOf(new FileDataSourceImpl(firstFile)));

        final ArrayList<Movie> m = new ArrayList<>();
        final List<Track>[] movieOneTracks = new List[videoList.size()];

        for (int i = 0; i < videoList.size(); i++) {
            final Movie movie = MovieCreator.build(String.valueOf(new FileDataSourceImpl(videoList.get(i))));
            m.add(movie);
            movieOneTracks[i] = movie.getTracks();
        }

        List<Track> videoTracks = new ArrayList<>();
        List<Track> audioTracks = new ArrayList<>();

        for (Movie m1 : m)
        {
            for (Track t : m1.getTracks())
            {
                if (t.getHandler().equals("soun"))
                {
                    //TODO: Add audio tracks here to the merging process
                     audioTracks.add(t);
                }
                if (t.getHandler().equals("vide"))
                {
                    videoTracks.add(t);
                }
            }
        }
        Movie result = new Movie();
        if (audioTracks.size() > 0)
        {
            result.addTrack(new AppendTrack(audioTracks.toArray(new Track[audioTracks.size()])));
        }
        if (videoTracks.size() > 0)
        {
            result.addTrack(new AppendTrack(videoTracks.toArray(new Track[videoTracks.size()])));
        }

//        final Movie finalMovie = new Movie();
//        final Movie finalMovie1 = new Movie();
//
//
//        //  final List<Track> movieOneTracks = movieA.getTracks();
//
//        final List<Track> movieTwoTracks = movieB.getTracks();
//
//        for (int i = 0; i < movieOneTracks.length || i < movieTwoTracks.size(); ++i) {
//            //  finalMovie.addTrack(new AppendTrack(movieTwoTracks.get(i), movieOneTracks.get(i)));
//        }
//
//        for (int i = 0; i < (movieOneTracks.length); i++) {
//
//            final List<Track> movieOneTracks_final ,movieOneTracks1, movieOneTracks2, movieOneTracks3;
//
//            movieOneTracks1 = movieOneTracks[i];
//            Object b = movieOneTracks1+","+movieOneTracks1;
////                movieOneTracks2 = movieOneTracks[i + 1];
////                movieOneTracks3 = movieOneTracks[i + 2];
//            try {
//                finalMovie.addTrack(new AppendTrack(movieOneTracks1.get(i)));
//            } catch (Exception e) {
//                e.printStackTrace();
//            }
//        }
        final Container container = new DefaultMp4Builder().build(result);
        final FileOutputStream fos = new FileOutputStream(new File(String.format(newFile)));
        final WritableByteChannel bb = Channels.newChannel(fos);
        container.writeContainer(bb);
        fos.close();
    }
}
