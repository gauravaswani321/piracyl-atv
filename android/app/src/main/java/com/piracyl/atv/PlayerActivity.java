package com.piracyl.atv;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.exoplayer2.C;
import com.google.android.exoplayer2.ExoPlayer;
import com.google.android.exoplayer2.Format;
import com.google.android.exoplayer2.MediaItem;
import com.google.android.exoplayer2.PlaybackException;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.Tracks;
import com.google.android.exoplayer2.audio.AudioAttributes;
import com.google.android.exoplayer2.source.DefaultMediaSourceFactory;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector;
import com.google.android.exoplayer2.trackselection.TrackSelectionOverride;
import com.google.android.exoplayer2.ui.StyledPlayerView;
import com.google.android.exoplayer2.upstream.DefaultHttpDataSource;
import com.google.android.exoplayer2.util.MimeTypes;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

public class PlayerActivity extends AppCompatActivity {
    private static final String TAG = "PlayerActivity";

    private StyledPlayerView playerView;
    private View topOverlay;
    private ExoPlayer player;
    private TextView titleView;
    private Button btnAudioTracks;
    private Button btnSubtitleTracks;
    private Button btnSwitchVlc;
    private LinearLayout errorLayout;
    private TextView errorMessage;
    private Button btnErrorVlc;
    private Button btnErrorClose;

    private final Handler hideHandler = new Handler(Looper.getMainLooper());
    private final Runnable hideControlsRunnable = this::hideControls;

    private String videoUrl = "";
    private String videoTitle = "";
    private String fileId = "";
    private String subtitleUrl = "";
    private long startPositionMs = 0;

    private static class AudioTrackOption {
        final Tracks.Group group;
        final int trackIndex;
        final String label;

        AudioTrackOption(Tracks.Group group, int trackIndex, String label) {
            this.group = group;
            this.trackIndex = trackIndex;
            this.label = label;
        }
    }

    private static class SubtitleTrackOption {
        final Tracks.Group group;
        final int trackIndex;
        final String label;

        SubtitleTrackOption(Tracks.Group group, int trackIndex, String label) {
            this.group = group;
            this.trackIndex = trackIndex;
            this.label = label;
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            // Keep screen on and full screen landscape
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_FULLSCREEN);

            setContentView(R.layout.activity_player);

            // Read intent data
            Intent intent = getIntent();
            if (intent != null) {
                videoUrl = intent.getStringExtra("url");
                videoTitle = intent.getStringExtra("title");
                fileId = intent.getStringExtra("fileId");
                subtitleUrl = intent.getStringExtra("subtitleUrl");
                startPositionMs = intent.getLongExtra("position", 0);
            }

            playerView = findViewById(R.id.player_view);
            topOverlay = findViewById(R.id.top_overlay);
            titleView = findViewById(R.id.video_title);
            btnAudioTracks = findViewById(R.id.btn_audio_tracks);
            btnSubtitleTracks = findViewById(R.id.btn_subtitle_tracks);
            btnSwitchVlc = findViewById(R.id.btn_switch_vlc);
            errorLayout = findViewById(R.id.error_layout);
            errorMessage = findViewById(R.id.error_message);
            btnErrorVlc = findViewById(R.id.btn_error_vlc);
            btnErrorClose = findViewById(R.id.btn_error_close);

            if (videoTitle != null && titleView != null) {
                titleView.setText(videoTitle);
            }

            if (btnAudioTracks != null) {
                btnAudioTracks.setOnClickListener(v -> showAudioTrackDialog());
            }
            if (btnSubtitleTracks != null) {
                btnSubtitleTracks.setOnClickListener(v -> showSubtitleTrackDialog());
            }
            if (btnSwitchVlc != null) {
                btnSwitchVlc.setOnClickListener(v -> launchVlcHandoff());
            }
            if (btnErrorVlc != null) {
                btnErrorVlc.setOnClickListener(v -> launchVlcHandoff());
            }
            if (btnErrorClose != null) {
                btnErrorClose.setOnClickListener(v -> finish());
            }

            initExoPlayer();
        } catch (Throwable t) {
            Log.e(TAG, "Fatal in PlayerActivity.onCreate", t);
            launchVlcHandoff();
        }
    }

    private void initExoPlayer() {
        if (videoUrl == null || videoUrl.isEmpty()) {
            showError("No video URL provided.");
            return;
        }

        try {
            // Track selector for multi-audio and subtitles
            DefaultTrackSelector trackSelector = new DefaultTrackSelector(this);

            // Configure HTTP Data Source with cross-protocol redirect support
            DefaultHttpDataSource.Factory httpDataSourceFactory = new DefaultHttpDataSource.Factory()
                    .setUserAgent("PiracyL-ATV")
                    .setAllowCrossProtocolRedirects(true)
                    .setConnectTimeoutMs(15000)
                    .setReadTimeoutMs(30000);

            DefaultMediaSourceFactory mediaSourceFactory = new DefaultMediaSourceFactory(httpDataSourceFactory);

            // Build ExoPlayer
            player = new ExoPlayer.Builder(this)
                    .setMediaSourceFactory(mediaSourceFactory)
                    .setTrackSelector(trackSelector)
                    .setSeekForwardIncrementMs(10000)
                    .setSeekBackIncrementMs(10000)
                    .build();

            // Setup Dolby movie audio attributes for HDMI passthrough / TV speaker decoding
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(C.USAGE_MEDIA)
                    .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
                    .build();
            player.setAudioAttributes(audioAttributes, true);

            playerView.setPlayer(player);
            playerView.requestFocus();

            playerView.setControllerVisibilityListener(new StyledPlayerView.ControllerVisibilityListener() {
                @Override
                public void onVisibilityChanged(int visibility) {
                    if (topOverlay != null) {
                        topOverlay.setVisibility(visibility);
                    }
                    if (visibility == View.VISIBLE) {
                        if (player != null && player.isPlaying()) {
                            scheduleHideControls(3500);
                        }
                    } else {
                        hideHandler.removeCallbacks(hideControlsRunnable);
                        playerView.requestFocus();
                    }
                }
            });

            // Setup MediaItem (with optional external subtitle)
            MediaItem.Builder mediaItemBuilder = new MediaItem.Builder()
                    .setUri(Uri.parse(videoUrl));

            if (subtitleUrl != null && !subtitleUrl.isEmpty()) {
                String mimeType = subtitleUrl.toLowerCase().contains(".vtt") ? MimeTypes.TEXT_VTT : MimeTypes.APPLICATION_SUBRIP;
                MediaItem.SubtitleConfiguration subConfig = new MediaItem.SubtitleConfiguration.Builder(Uri.parse(subtitleUrl))
                        .setMimeType(mimeType)
                        .setLanguage("en")
                        .setLabel("External Subtitles")
                        .setSelectionFlags(C.SELECTION_FLAG_DEFAULT)
                        .build();
                mediaItemBuilder.setSubtitleConfigurations(Collections.singletonList(subConfig));
            }

            MediaItem mediaItem = mediaItemBuilder.build();
            player.setMediaItem(mediaItem);

            // Add lifecycle and error listeners
            player.addListener(new Player.Listener() {
                @Override
                public void onPlayerError(PlaybackException error) {
                    showError("ExoPlayer could not decode this stream (" + error.getErrorCodeName() + "). You can switch directly to VLC for full software codec support.");
                }

                @Override
                public void onIsPlayingChanged(boolean isPlaying) {
                    if (isPlaying) {
                        scheduleHideControls(2500);
                    } else {
                        showControls();
                        hideHandler.removeCallbacks(hideControlsRunnable);
                    }
                }

                @Override
                public void onPlaybackStateChanged(int playbackState) {
                    if (playbackState == Player.STATE_READY && player != null && player.getPlayWhenReady()) {
                        scheduleHideControls(2500);
                    } else if (playbackState == Player.STATE_ENDED) {
                        saveProgress(0); // clear progress
                        showControls();
                    }
                }

                @Override
                public void onTracksChanged(Tracks tracks) {
                    updateTrackButtonLabels();
                }
            });

            player.prepare();

            if (startPositionMs > 5000) {
                player.seekTo(startPositionMs);
            }

            player.play();

        } catch (Throwable e) {
            Log.e(TAG, "Failed to initialize ExoPlayer", e);
            showError("Failed to initialize ExoPlayer: " + e.getMessage());
        }
    }

    private String buildAudioTrackLabel(Format format, int index) {
        StringBuilder sb = new StringBuilder();
        if (format.label != null && !format.label.isEmpty()) {
            sb.append(format.label);
        } else if (format.language != null && !format.language.isEmpty() && !"und".equals(format.language)) {
            Locale loc = new Locale(format.language);
            sb.append(loc.getDisplayLanguage());
        } else {
            sb.append("Audio Track ").append(index);
        }

        if (format.channelCount > 0) {
            if (format.channelCount == 6) {
                sb.append(" [5.1 Surround]");
            } else if (format.channelCount == 8) {
                sb.append(" [7.1 Surround]");
            } else if (format.channelCount == 2) {
                sb.append(" [Stereo]");
            } else if (format.channelCount == 1) {
                sb.append(" [Mono]");
            }
        }

        if (format.sampleMimeType != null) {
            if (format.sampleMimeType.contains("eac3") || format.sampleMimeType.contains("ac3")) {
                sb.append(" (Dolby)");
            } else if (format.sampleMimeType.contains("dts")) {
                sb.append(" (DTS)");
            } else if (format.sampleMimeType.contains("mp4a") || format.sampleMimeType.contains("aac")) {
                sb.append(" (AAC)");
            } else if (format.sampleMimeType.contains("opus")) {
                sb.append(" (Opus)");
            }
        }
        return sb.toString();
    }

    private String buildSubtitleTrackLabel(Format format, int index) {
        if (format.label != null && !format.label.isEmpty()) {
            return format.label;
        }
        if (format.language != null && !format.language.isEmpty() && !"und".equals(format.language)) {
            Locale loc = new Locale(format.language);
            return loc.getDisplayLanguage();
        }
        return "Subtitle Track " + index;
    }

    private void updateTrackButtonLabels() {
        if (player == null) return;
        Tracks tracks = player.getCurrentTracks();

        // Check selected audio
        String currentAudio = "Audio";
        int audioTrackCount = 0;
        for (Tracks.Group group : tracks.getGroups()) {
            if (group.getType() == C.TRACK_TYPE_AUDIO) {
                for (int i = 0; i < group.length; i++) {
                    audioTrackCount++;
                    if (group.isTrackSelected(i)) {
                        Format format = group.getTrackFormat(i);
                        currentAudio = "Audio: " + (format.language != null && !format.language.isEmpty() && !"und".equals(format.language)
                                ? new Locale(format.language).getDisplayLanguage()
                                : (format.label != null && !format.label.isEmpty() ? format.label : "Track " + audioTrackCount));
                    }
                }
            }
        }

        // Check selected subtitle
        String currentSub = "Subtitles";
        boolean subDisabled = player.getTrackSelectionParameters().disabledTrackTypes.contains(C.TRACK_TYPE_TEXT);
        if (subDisabled) {
            currentSub = "Sub: Off";
        } else {
            int subTrackCount = 0;
            for (Tracks.Group group : tracks.getGroups()) {
                if (group.getType() == C.TRACK_TYPE_TEXT) {
                    for (int i = 0; i < group.length; i++) {
                        subTrackCount++;
                        if (group.isTrackSelected(i)) {
                            Format format = group.getTrackFormat(i);
                            String lang = format.language != null && !format.language.isEmpty() && !"und".equals(format.language)
                                    ? new Locale(format.language).getDisplayLanguage()
                                    : (format.label != null && !format.label.isEmpty() ? format.label : "Track " + subTrackCount);
                            currentSub = "Sub: " + lang;
                        }
                    }
                }
            }
        }

        final String finalAudio = currentAudio;
        final String finalSub = currentSub;
        runOnUiThread(() -> {
            if (btnAudioTracks != null) {
                btnAudioTracks.setText(finalAudio);
            }
            if (btnSubtitleTracks != null) {
                btnSubtitleTracks.setText(finalSub);
            }
        });
    }

    private void showAudioTrackDialog() {
        if (player == null) return;
        Tracks tracks = player.getCurrentTracks();

        List<AudioTrackOption> audioOptions = new ArrayList<>();
        int selectedIndex = -1;

        for (Tracks.Group group : tracks.getGroups()) {
            if (group.getType() == C.TRACK_TYPE_AUDIO) {
                for (int i = 0; i < group.length; i++) {
                    Format format = group.getTrackFormat(i);
                    boolean isSelected = group.isTrackSelected(i);
                    String label = buildAudioTrackLabel(format, audioOptions.size() + 1);
                    if (isSelected) {
                        selectedIndex = audioOptions.size();
                    }
                    audioOptions.add(new AudioTrackOption(group, i, label));
                }
            }
        }

        if (audioOptions.isEmpty()) {
            Toast.makeText(this, "No alternative audio tracks found in this stream", Toast.LENGTH_SHORT).show();
            return;
        }

        String[] items = new String[audioOptions.size()];
        for (int i = 0; i < audioOptions.size(); i++) {
            items[i] = audioOptions.get(i).label;
        }

        hideHandler.removeCallbacks(hideControlsRunnable);
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Select Audio Language")
                .setSingleChoiceItems(items, selectedIndex, (d, which) -> {
                    AudioTrackOption option = audioOptions.get(which);
                    TrackSelectionOverride override = new TrackSelectionOverride(
                            option.group.getMediaTrackGroup(),
                            Collections.singletonList(option.trackIndex)
                    );
                    player.setTrackSelectionParameters(
                            player.getTrackSelectionParameters()
                                    .buildUpon()
                                    .clearOverridesOfType(C.TRACK_TYPE_AUDIO)
                                    .addOverride(override)
                                    .setTrackTypeDisabled(C.TRACK_TYPE_AUDIO, false)
                                    .build()
                    );
                    updateTrackButtonLabels();
                    d.dismiss();
                })
                .setNegativeButton("Cancel", null)
                .create();

        dialog.setOnDismissListener(d -> {
            if (player != null && player.isPlaying()) {
                scheduleHideControls(3000);
            }
        });
        dialog.show();
    }

    private void showSubtitleTrackDialog() {
        if (player == null) return;
        Tracks tracks = player.getCurrentTracks();

        List<SubtitleTrackOption> subOptions = new ArrayList<>();
        // First option is always "Off"
        subOptions.add(new SubtitleTrackOption(null, -1, "Off (Disable Subtitles)"));

        int selectedIndex = 0;

        for (Tracks.Group group : tracks.getGroups()) {
            if (group.getType() == C.TRACK_TYPE_TEXT) {
                for (int i = 0; i < group.length; i++) {
                    Format format = group.getTrackFormat(i);
                    boolean isSelected = group.isTrackSelected(i);
                    String label = buildSubtitleTrackLabel(format, subOptions.size());
                    if (isSelected && !player.getTrackSelectionParameters().disabledTrackTypes.contains(C.TRACK_TYPE_TEXT)) {
                        selectedIndex = subOptions.size();
                    }
                    subOptions.add(new SubtitleTrackOption(group, i, label));
                }
            }
        }

        if (subOptions.size() <= 1) {
            Toast.makeText(this, "No subtitle tracks available for this video", Toast.LENGTH_SHORT).show();
            return;
        }

        String[] items = new String[subOptions.size()];
        for (int i = 0; i < subOptions.size(); i++) {
            items[i] = subOptions.get(i).label;
        }

        hideHandler.removeCallbacks(hideControlsRunnable);
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Select Subtitles")
                .setSingleChoiceItems(items, selectedIndex, (d, which) -> {
                    SubtitleTrackOption option = subOptions.get(which);
                    if (option.group == null || which == 0) {
                        player.setTrackSelectionParameters(
                                player.getTrackSelectionParameters()
                                        .buildUpon()
                                        .clearOverridesOfType(C.TRACK_TYPE_TEXT)
                                        .setTrackTypeDisabled(C.TRACK_TYPE_TEXT, true)
                                        .build()
                        );
                    } else {
                        TrackSelectionOverride override = new TrackSelectionOverride(
                                option.group.getMediaTrackGroup(),
                                Collections.singletonList(option.trackIndex)
                        );
                        player.setTrackSelectionParameters(
                                player.getTrackSelectionParameters()
                                        .buildUpon()
                                        .clearOverridesOfType(C.TRACK_TYPE_TEXT)
                                        .addOverride(override)
                                        .setTrackTypeDisabled(C.TRACK_TYPE_TEXT, false)
                                        .build()
                        );
                    }
                    updateTrackButtonLabels();
                    d.dismiss();
                })
                .setNegativeButton("Cancel", null)
                .create();

        dialog.setOnDismissListener(d -> {
            if (player != null && player.isPlaying()) {
                scheduleHideControls(3000);
            }
        });
        dialog.show();
    }

    private void showError(String msg) {
        if (errorMessage != null) {
            errorMessage.setText(msg);
        }
        if (errorLayout != null) {
            errorLayout.setVisibility(View.VISIBLE);
            if (btnErrorVlc != null) {
                btnErrorVlc.requestFocus();
            }
        }
    }

    private void launchVlcHandoff() {
        long currentPos = (player != null) ? player.getCurrentPosition() : startPositionMs;
        releasePlayer();

        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(Uri.parse(videoUrl), "video/*");
            if (videoTitle != null) {
                intent.putExtra("title", videoTitle);
            }
            if (currentPos > 0) {
                intent.putExtra("position", currentPos);
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);

            // Try VLC directly first
            intent.setPackage("org.videolan.vlc");
            try {
                startActivity(intent);
            } catch (Exception ex) {
                // Fallback to system player chooser if VLC not installed
                intent.setPackage(null);
                Intent chooser = Intent.createChooser(intent, "Play with");
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(chooser);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error launching VLC handoff", e);
        }

        finish();
    }

    private void saveProgress(long positionMs) {
        if (fileId == null || fileId.isEmpty()) return;
        SharedPreferences prefs = getSharedPreferences("piracyl_progress", MODE_PRIVATE);
        prefs.edit().putLong(fileId, positionMs).apply();
    }

    private boolean isControlsVisible() {
        return (playerView != null && playerView.isControllerFullyVisible())
                || (topOverlay != null && topOverlay.getVisibility() == View.VISIBLE);
    }

    private void showControls() {
        if (topOverlay != null) {
            topOverlay.setVisibility(View.VISIBLE);
        }
        if (playerView != null) {
            playerView.showController();
        }
    }

    private void hideControls() {
        hideHandler.removeCallbacks(hideControlsRunnable);
        if (topOverlay != null) {
            topOverlay.setVisibility(View.GONE);
        }
        if (playerView != null) {
            playerView.hideController();
            View currentFocus = getCurrentFocus();
            if (currentFocus != null && currentFocus != playerView) {
                currentFocus.clearFocus();
            }
            playerView.requestFocus();
        }
    }

    private void scheduleHideControls(long delayMs) {
        hideHandler.removeCallbacks(hideControlsRunnable);
        hideHandler.postDelayed(hideControlsRunnable, delayMs);
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            if (isControlsVisible() && player != null && player.isPlaying()) {
                scheduleHideControls(4000);
            }
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (player == null) return super.onKeyDown(keyCode, event);

        switch (keyCode) {
            case KeyEvent.KEYCODE_DPAD_CENTER:
            case KeyEvent.KEYCODE_ENTER:
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
                if (player.isPlaying()) {
                    player.pause();
                    showControls();
                    hideHandler.removeCallbacks(hideControlsRunnable);
                } else {
                    player.play();
                    scheduleHideControls(2000);
                }
                return true;

            case KeyEvent.KEYCODE_DPAD_UP:
                showControls();
                if (btnAudioTracks != null) {
                    btnAudioTracks.requestFocus();
                }
                scheduleHideControls(5000);
                return true;

            case KeyEvent.KEYCODE_DPAD_DOWN:
                if (isControlsVisible()) {
                    hideControls();
                } else {
                    showControls();
                    scheduleHideControls(3500);
                }
                return true;

            case KeyEvent.KEYCODE_DPAD_LEFT:
            case KeyEvent.KEYCODE_MEDIA_REWIND:
                player.seekBack();
                showControls();
                scheduleHideControls(3000);
                return true;

            case KeyEvent.KEYCODE_DPAD_RIGHT:
            case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD:
                player.seekForward();
                showControls();
                scheduleHideControls(3000);
                return true;

            case KeyEvent.KEYCODE_CAPTIONS:
                showSubtitleTrackDialog();
                return true;

            case KeyEvent.KEYCODE_MEDIA_AUDIO_TRACK:
            case KeyEvent.KEYCODE_MENU:
                showAudioTrackDialog();
                return true;

            case KeyEvent.KEYCODE_BACK:
                if (isControlsVisible()) {
                    hideControls();
                    return true;
                }
                finish();
                return true;
        }

        return super.onKeyDown(keyCode, event);
    }

    private void releasePlayer() {
        hideHandler.removeCallbacks(hideControlsRunnable);
        if (player != null) {
            if (player.getDuration() > 0 && player.getCurrentPosition() > 0) {
                saveProgress(player.getCurrentPosition());
            }
            player.release();
            player = null;
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (player != null) {
            player.pause();
        }
    }

    @Override
    protected void onStop() {
        super.onStop();
        releasePlayer();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        releasePlayer();
    }
}
