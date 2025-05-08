# Dia 1.6B TTS Model Integration Guide

This document provides guidance on how to integrate the Dia 1.6B text-to-speech model into the interview application.

## Overview

Dia is a 1.6B parameter TTS model developed by Nari Labs that can generate realistic multi-speaker dialogue. It supports:
- Natural two-speaker dialogue
- Non-verbal cues (laughs, coughs, etc.)
- Optional voice cloning with reference audio

## Installation Steps

1. Install the Dia package:
   ```bash
   pip install git+https://github.com/nari-labs/dia.git
   ```

2. Create a Python script to integrate Dia with our application:
   ```python
   # server/dia_model.py
   from dia.model import Dia
   
   class DiaService:
       def __init__(self, model_path="nari-labs/Dia-1.6B"):
           self.model = Dia.from_pretrained(model_path, compute_dtype="float16")
       
       def generate_speech(self, text, output_path):
           """
           Generate speech from text and save to file
           
           Args:
               text (str): Text to convert to speech
               output_path (str): Path to save audio file
               
           Returns:
               str: Path to generated audio file
           """
           # Format for interview context
           formatted_text = f"[S1] {text}"
           
           # Generate audio
           audio = self.model.generate(
               formatted_text,
               temperature=0.8,  # Lower temperature for more consistent output
               use_torch_compile=True  # For better performance
           )
           
           # Save audio file
           self.model.save_audio(output_path, audio)
           
           return output_path
   ```

3. Create an API endpoint in Express to connect to the Python script:
   ```typescript
   // In server/routes.ts
   import { spawn } from 'child_process';
   import path from 'path';
   import fs from 'fs';
   import { v4 as uuidv4 } from 'uuid';
   
   // Add this endpoint
   app.post("/api/tts/dia", async (req, res, next) => {
     try {
       if (!req.isAuthenticated()) {
         return res.status(401).json({ message: "Not authenticated" });
       }
       
       const { text } = req.body;
       
       if (!text) {
         return res.status(400).json({ message: "Text is required" });
       }
       
       // Generate a unique output filename
       const outputFile = path.join(tmpdir(), `dia_speech_${uuidv4()}.mp3`);
       
       // Call Python script to generate speech
       const pythonProcess = spawn('python', [
         'server/dia_script.py',
         text,
         outputFile
       ]);
       
       pythonProcess.on('close', (code) => {
         if (code !== 0) {
           return res.status(500).json({ message: "Failed to generate speech" });
         }
         
         // Stream the audio file
         res.setHeader('Content-Type', 'audio/mp3');
         res.setHeader('Content-Disposition', `attachment; filename="speech.mp3"`);
         
         const fileStream = fs.createReadStream(outputFile);
         fileStream.pipe(res);
         
         // Clean up after streaming
         fileStream.on('end', () => {
           fs.unlink(outputFile, (err) => {
             if (err) console.error('Error deleting temp file:', err);
           });
         });
       });
     } catch (error) {
       next(error);
     }
   });
   ```

4. Create a Python script to handle the TTS generation:
   ```python
   # server/dia_script.py
   import sys
   from dia.model import Dia
   
   def main():
       if len(sys.argv) != 3:
           print("Usage: python dia_script.py <text> <output_file>")
           sys.exit(1)
           
       text = sys.argv[1]
       output_file = sys.argv[2]
       
       # Format text for dialogue
       formatted_text = f"[S1] {text}"
       
       # Initialize model
       model = Dia.from_pretrained("nari-labs/Dia-1.6B", compute_dtype="float16")
       
       # Generate audio
       audio = model.generate(formatted_text, use_torch_compile=True)
       
       # Save audio
       model.save_audio(output_file, audio)
       
       print(f"Audio saved to {output_file}")
       sys.exit(0)
       
   if __name__ == "__main__":
       main()
   ```

5. Update the client-side useTTS hook to support the Dia model:
   ```typescript
   // In client/src/hooks/use-tts.tsx
   
   // Add this function inside the useTTS hook
   const speakWithDia = async (text: string): Promise<void> => {
     try {
       // Request audio from Dia model
       const response = await axios.post('/api/tts/dia', { text }, {
         responseType: 'blob'
       });
       
       // Create object URL for audio playback
       const audioBlob = new Blob([response.data], { type: 'audio/mp3' });
       const audioUrl = URL.createObjectURL(audioBlob);
       
       // Create audio element
       const audio = new Audio(audioUrl);
       
       // Set up event handlers
       audio.onplay = () => {
         setIsSpeaking(true);
         onAudioStart?.();
       };
       
       audio.onended = () => {
         setIsSpeaking(false);
         onAudioEnd?.();
         URL.revokeObjectURL(audioUrl);
       };
       
       audio.onerror = () => {
         setIsSpeaking(false);
         onError?.(new Error('Audio playback failed'));
         URL.revokeObjectURL(audioUrl);
       };
       
       // Play the audio
       await audio.play();
       
       // Store the audio source for reference
       setAudioSrc(audioUrl);
     } catch (error) {
       throw new Error('Failed to generate speech with Dia model');
     }
   };
   ```

## Hardware Requirements

- **Recommended**: NVIDIA GPU with at least 10GB VRAM
- Performance on RTX 4090: ~2.2× real-time with float16 precision

## Best Practices

1. Keep text inputs reasonably sized (5-20 seconds of speech)
2. Properly format speaker tags: Always use [S1] and [S2] in alternating fashion
3. Use non-verbal cues sparingly for the best output quality
4. Consider pre-processing text for better pronunciation

## Troubleshooting

1. If experiencing memory issues, reduce batch size or use a smaller model
2. For better performance, use `torch.compile` and float16 precision
3. If Dia model is not available, the app will fall back to browser's SpeechSynthesis API

## References

- [Dia GitHub Repository](https://github.com/nari-labs/dia)
- [Dia on Hugging Face](https://huggingface.co/nari-labs/Dia-1.6B)