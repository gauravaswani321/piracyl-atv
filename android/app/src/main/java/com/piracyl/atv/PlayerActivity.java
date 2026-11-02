package com.piracyl.atv;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.exoplayer2.C;
import com.google.android.exoplayer2.ExoPlayer;
import com.google.android.exoplayer2.MediaItem;
import com.google.android.exoplayer2.PlaybackException;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.audio.AudioAttributes;
import com.google.android.exoplayer2.source.DefaultMediaSourceFactory;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector;
import com.google.android.exoplayer2.ui.StyledPlayerView;
import com.google.android.exoplayer2.upstream.DefaultHttpDataSource;

public class PlayerActivity extends AppCompatActivity {

    private StyledPlayerView playerView;
    private ExoPlayer player;
    private TextView titleView;
    private Button btnSwitchVlc;
    private LinearLayout errorLayout;
    private TextView errorMessage;
    private Button btnErrorVlc;
    private Button btnErrorClose;

    private String videoUrl = "";
    private String videoTitle = "";
    private String fileId = "";
    private long startPositionMs = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep screen on and full screen landscape
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_FULLSCREEN);

        setContentView(R.layout.activity_player);

        // Read intent data
        Intent intent = getIntent();
        if (intent != null) {
            videoUrl = intent.getStringExtra("url");
            videoTitle = intent.getStringExtra("title");
            fileId = intent.getStringExtra("fileId");
            startPositionMs = intent.getLongExtra("position", 0);
        }

        playerView = findViewById(R.id.player_view);
        titleView = findViewById(R.id.video_title);
        btnSwitchVlc = findViewById(R.id.btn_switch_vlc);
        errorLayout = findViewById(R.id.error_layout);
        errorMessage = findViewById(R.id.error_message);
        btnErrorVlc = findViewById(R.id.btn_error_vlc);
        btnErrorClose = findViewById(R.id.btn_error_close);

        if (videoTitle != null) {
            titleView.setText(videoTitle);
        }

        btnSwitchVlc.setOnClickListener(v -> launchVlcHandoff());
        btnErrorVlc.setOnClickListener(v -> launchVlcHandoff());
        btnErrorClose.setOnClickListener(v -> finish());

        initExoPlayer();
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

            // Setup MediaItem
            MediaItem mediaItem = MediaItem.fromUri(Uri.parse(videoUrl));
            player.setMediaItem(mediaItem);

            // Add lifecycle and error listeners
            player.addListener(new Player.Listener() {
                @Override
                public void onPlayerError(PlaybackException error) {
                    showError("ExoPlayer could not decode this stream (" + error.getErrorCodeName() + "). You can switch directly to VLC for full software codec support.");
                }

                @Override
                public void onPlaybackStateChanged(int playbackState) {
                    if (playbackState == Player.STATE_ENDED) {
                        saveProgress(0); // clear progress
                    }
                }
            });

            player.prepare();

            if (startPositionMs > 5000) {
                player.seekTo(startPositionMs);
            }

            player.play();

        } catch (Exception e) {
            showError("Failed to initialize ExoPlayer: " + e.getMessage());
        }
    }

    private void showError(String msg) {
        if (errorMessage != null) {
            errorMessage.setText(msg);
        }
        if (errorLayout != null) {
            errorLayout.setVisibility(View.VISIBLE);
            btnErrorVlc.requestFocus();
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

            Intent chooser = Intent.createChooser(intent, "Play with");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(chooser);
        } catch (Exception e) {
            e.printStackTrace();
        }

        finish();
    }

    private void saveProgress(long positionMs) {
        if (fileId == null || fileId.isEmpty()) return;
        SharedPreferences prefs = getSharedPreferences("piracyl_progress", MODE_PRIVATE);
        prefs.edit().putLong(fileId, positionMs).apply();
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
                } else {
                    player.play();
                }
                playerView.showController();
                return true;

            case KeyEvent.KEYCODE_DPAD_LEFT:
            case KeyEvent.KEYCODE_MEDIA_REWIND:
                player.seekBack();
                playerView.showController();
                return true;

            case KeyEvent.KEYCODE_DPAD_RIGHT:
            case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD:
                player.seekForward();
                playerView.showController();
                return true;

            case KeyEvent.KEYCODE_BACK:
                finish();
                return true;
        }

        return super.onKeyDown(keyCode, event);
    }

    private void releasePlayer() {
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

