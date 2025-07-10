import Transcript from '../models/transcript.model.js';
import fs from 'fs';
import path from 'path';
import ytdl from 'ytdl-core';
import ffmpegPath from 'ffmpeg-static';
import { exec } from 'child_process';
import util from 'util';
import axios from 'axios';
import FormData from 'form-data';

const execPromise = util.promisify(exec); // Convert exec to a promise-based function

export const generateTranscript = async (req, res) => {
    const { videoUrl, videoId } = req.body;

    if (!videoUrl || !videoId) {
        return res.status(400).json({ error: 'Video URL and ID are required.' });
    }

    const videoFile = `tmp/video-${Date.now()}.mp4`;
    const audioFile = `tmp/audio-${videoId}.mp3`;

    try {
        // download video
        const videoStream = ytdl(videoUrl, { quality: 'highestvideo' }); 
        //video will not be downloaded at once, it will be streamed, for better memory efficiency and faster processing

        const videoWriteStream = fs.createWriteStream(videoFile); // to write YT video to an actual .mp4  file

        videoStream.pipe(videoWriteStream);

        await new Promise((resolve, reject) => {
            videoWriteStream.on('finish', resolve);
            videoWriteStream.on('error', reject);
        })

        // extract audio using ffmpeg
        await execPromise(`${ffmpegPath} -i ${videoFile} -q:a 0 -map a ${audioFile}`);

        // transcript audio using Whisper API
        const formData = new FormData();
        formData.append('file', fs.createReadStream(audioFile));
        formData.append('model', 'whisper-1');

        const response = await axios.post(
            "https://api.openai.com/v1/audio/transcriptions",
            formData,
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    ...formData.getHeaders(),
                },
            }
        );

        const transcriptText = response.data.text;
        if (!transcriptText) {
            return res.status(500).json({ 
                success: false,
                error: 'Failed to generate transcript.' 
            });
        }

        // save transcript to database
        const transcript = await Transcript.create({
            video: videoId,
            transcriptText,
        });

        // clean up temporary files
        fs.unlinkSync(videoFile);
        fs.unlinkSync(audioFile);

        return res.status(200).json({
            success: true,
            message: 'Transcript generated successfully.',
            transcript,
        });
    } catch (error) {
        console.error('Error generating transcript:', error);
        
        // clean up temporary files in case of error
        if (fs.existsSync(videoFile)) fs.unlinkSync(videoFile);
        if (fs.existsSync(audioFile)) fs.unlinkSync(audioFile);
        
        return res.status(500).json({ 
            success: false,
            error: 'Error generating transcript.' 
        });
    }
}

export const getTranscript = async (req, res) => {
    try {
        const { videoId } = req.params;
        if (!videoId) {
            return res.status(400).json({ 
                success: false,
                error: 'Video ID is required.' 
            });
        }

        const transcript = await Transcript.findOne({ video: videoId });
        if (!transcript) {
            return res.status(404).json({ 
                success: false,
                error: 'Transcript not found.' 
            });
        }

        return res.status(200).json({
            success: true,
            transcript,
        });
    } catch (error) {
        console.error('Error fetching transcript:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Error fetching transcript.' 
        });
    }
}