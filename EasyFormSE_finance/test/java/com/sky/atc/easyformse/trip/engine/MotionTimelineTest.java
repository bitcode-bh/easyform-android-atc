package com.sky.atc.easyformse.trip.engine;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import org.junit.Test;

import java.util.ArrayList;
import java.util.List;

public class MotionTimelineTest {

    private static final DrivingContext.Activity V = DrivingContext.Activity.VEHICLE;
    private static final DrivingContext.Activity FOOT = DrivingContext.Activity.ON_FOOT;
    private static final DrivingContext.Activity UNK = DrivingContext.Activity.UNKNOWN;

    private final MotionTimeline t = new MotionTimeline();
    private final List<MotionTimeline.Segment> closed = new ArrayList<>();
    private long now = 1_000_000L;

    /** One fix per second for {@code seconds}. */
    private void feed(int seconds, double kmh, String site, DrivingContext.Activity a) {
        for (int i = 0; i < seconds; i++) {
            MotionTimeline.Segment s = t.onFix(now, kmh, site, a, kmh / 3.6);
            if (s != null) closed.add(s);
            now += 1000;
        }
    }

    @Test
    public void driveThenTrafficStopThenDriveIsOneDrive() {
        feed(120, 40, null, V);
        feed(60, 0, null, V);          // a minute at a signal: shorter than the idle hold
        feed(120, 40, null, V);
        assertEquals(MotionTimeline.State.DRIVING, t.state());
        assertEquals(0, closed.size());
    }

    @Test
    public void longStopMidDriveIsIdleFromWhenItStarted() {
        feed(120, 40, null, V);
        long stopAt = now;
        feed(300, 0, null, V);
        assertEquals(MotionTimeline.State.IDLE, t.state());
        assertEquals(stopAt, t.stateStartMs());
        assertEquals(1, closed.size());
        assertEquals(MotionTimeline.State.DRIVING, closed.get(0).state);
        assertEquals(stopAt, closed.get(0).endMs);
    }

    @Test
    public void arrivingAtASiteIsOnSite() {
        feed(120, 40, null, V);
        long arrive = now;
        feed(240, 1, "SITE-7", FOOT);
        assertEquals(MotionTimeline.State.ON_SITE, t.state());
        assertEquals(arrive, t.stateStartMs());
    }

    @Test
    public void walkingAwayFromTheVehicleIsWalking() {
        feed(120, 40, null, V);
        feed(120, 4, null, FOOT);
        assertEquals(MotionTimeline.State.WALKING, t.state());
    }

    @Test
    public void idleForTwentyMinutesBecomesStopped() {
        feed(120, 40, null, V);
        feed(26 * 60, 0, null, UNK);
        assertEquals(MotionTimeline.State.STOPPED, t.state());
    }

    @Test
    public void noLocationForTwoMinutesIsNoSignal() {
        feed(120, 40, null, V);
        long lost = now;
        assertNull(t.onAvailability(now, false));
        now += 3 * 60_000L;
        MotionTimeline.Segment s = t.tick(now);
        assertEquals(MotionTimeline.State.NO_SIGNAL, t.state());
        assertEquals(lost, t.stateStartMs());
        assertEquals(MotionTimeline.State.DRIVING, s.state);
    }

    @Test
    public void segmentsCarryDistanceAndTopSpeed() {
        feed(100, 36, null, V);   // 10 m/s for 100 s = 1 km
        feed(300, 0, null, V);
        MotionTimeline.Segment drive = closed.get(0);
        assertEquals(1000, drive.meters, 20);
        assertEquals(36, drive.maxKmh, 0.001);
    }
}
