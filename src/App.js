import React, { useState, useEffect } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({ log: true });

const VideoCompressor = () => {
  const [ready, setReady] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [outputVideo, setOutputVideo] = useState(null);
  const [progress, setProgress] = useState(0);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState(null);
  const [resolution, setResolution] = useState(720); // Default resolution 720p

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        await ffmpeg.load();
        setReady(true);
      } catch (error) {
        setError('Failed to load ffmpeg.');
        console.error(error);
      }
    };

    loadFFmpeg();
  }, []);

  const handleFileChange = (event) => {
    setVideoFile(event.target.files[0]);
  };

  const handleConvert = async () => {
    try {
      setConverting(true);
      setError(null);
      setProgress(0);

      // Turn file data into Uint8Array
      const fileData = await fetchFile(videoFile);

      // Write the file to the filesystem
      ffmpeg.FS('writeFile', 'input.mp4', fileData);

      // Start the conversion process with resolution selection
      ffmpeg.setProgress(({ ratio }) => setProgress(Math.round(ratio * 100)));
      await ffmpeg.run(
        '-i',
        'input.mp4',
        '-vf',
        `scale=-2:${resolution}`,
        '-c:v',
        'libx264',
        '-crf',
        '28',
        '-preset',
        'fast',
        'output.mp4'
      );

      // Read the output file
      const data = ffmpeg.FS('readFile', 'output.mp4');
      const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
      const videoURL = URL.createObjectURL(videoBlob);

      setOutputVideo(videoURL);
      setConverting(false);
    } catch (error) {
      setError('An error occurred during conversion.');
      setConverting(false);
      console.error(error);
    }
  };

  const saveFile = () => {
    const link = document.createElement('a');
    link.href = outputVideo;
    link.setAttribute('download', 'compressed_video.mp4');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (!ready) {
    return <p>Loading ffmpeg...</p>;
  }

  return (
    <div className="video-compressor">
      <h1>Video Compressor</h1>

      {/* Step 1: File Selection */}
      {!videoFile && (
        <div>
          <input type="file" accept="video/mp4" onChange={handleFileChange} />
        </div>
      )}

      {/* Step 2: Resolution Selection */}
      {videoFile && !outputVideo && (
        <div>
          <label htmlFor="resolution">Select Resolution:</label>
          <select
            id="resolution"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          >
            <option value={480}>480p</option>
            <option value={720}>720p</option>
            <option value={1080}>1080p</option>
          </select>
        </div>
      )}

      {/* Step 3: Convert Button */}
      {videoFile && !outputVideo && !converting && (
        <button onClick={handleConvert}>Convert Video</button>
      )}

      {/* Step 4: Show progress */}
      {converting && (
        <div>
          <p>Converting: {progress}%</p>
        </div>
      )}

      {/* Step 5: Display Save Button */}
      {outputVideo && (
        <div>
          <video src={outputVideo} controls width="400" />
          <br />
          <button onClick={saveFile}>Save Video</button>
        </div>
      )}

      {/* Step 6: Show error if any */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default VideoCompressor;
