package com.sky.atc.easyformse.annotation;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/** Image-relative commands: no screen coordinates or full-size bitmap history. */
public final class AnnotationDocument {
    public static final class Command {
        public final boolean clear, erase;
        public final int color;
        public final float width;
        private final float[] points;
        private Command(boolean clear, boolean erase, int color, float width, float[] points) {
            this.clear = clear; this.erase = erase; this.color = color; this.width = width;
            this.points = points.clone();
        }
        public float[] points() { return points.clone(); }
    }
    private final List<Command> commands = new ArrayList<>();
    private int position;
    public synchronized void stroke(boolean erase, int color, float width, float[] points) {
        if (!Float.isFinite(width) || width <= 0 || points.length < 2 || points.length % 2 != 0)
            throw new IllegalArgumentException("Invalid stroke");
        for (float point : points) if (!Float.isFinite(point)) throw new IllegalArgumentException("Invalid point");
        add(new Command(false, erase, color, width, points));
    }
    public synchronized void clear() { add(new Command(true, false, 0, 0, new float[0])); }
    private void add(Command command) {
        commands.subList(position, commands.size()).clear(); commands.add(command); position++;
    }
    public synchronized boolean canUndo() { return position > 0; }
    public synchronized boolean canRedo() { return position < commands.size(); }
    public synchronized void undo() { if (canUndo()) position--; }
    public synchronized void redo() { if (canRedo()) position++; }
    public synchronized boolean isDirty() { return position > 0; }
    public synchronized List<Command> snapshot() {
        return Collections.unmodifiableList(new ArrayList<>(commands.subList(0, position)));
    }
}
