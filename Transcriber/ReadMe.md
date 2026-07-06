# Hebrew Transcriber 🎧🇮🇱

A Python-based tool for automated batch transcription of long Hebrew audio files. This project utilizes the advanced `whisper-large-v3` model by the **ivrit.ai** community. It is specifically optimized for free cloud environments like Google Colab, addressing Out-Of-Memory (OOM) challenges and managing long runtime sessions.

## Features

* **GPU Memory Optimization:** Utilizes `torch.float16` to halve memory consumption and prevent Out of Memory errors when loading the large model.
* **Long Audio Handling:** Implements 30-second chunking behind the scenes to prevent model "hallucinations" and infinite text loops.
* **Smart Resume/Bypass Mechanism:** Automatically scans the target directory and skips already transcribed files, allowing for seamless resumption if the server disconnects.
* **Seamless Google Drive Integration:** Reads audio files directly from the cloud and saves outputs (TXT and JSON with timestamps) in the same directory.

## Prerequisites & Setup

1. **Google Account:** You need an active Google account to use Google Drive and Google Colab.
2. **Prepare Your Drive:**
* Create a dedicated folder in your Google Drive.
* Upload all the audio files (e.g., `.mp3`) you want to transcribe into this folder **before** running the script.



## Usage

Since the code is provided as a Jupyter Notebook, running it is straightforward:

1. Open the provided `.ipynb` notebook file using **Google Colab**.
2. Go to the top menu and select **Runtime** -> **Change runtime type**, then choose **T4 GPU**.
3. In the transcription code cell, locate the `drive_folder` variable and update it with the exact path to the folder you created in your Google Drive (e.g., `/content/drive/MyDrive/Your_Folder_Name`).
4. Run the cells sequentially. When prompted, allow Colab to mount and access your Google Drive.

## Preventing Google Colab Disconnections (Keep-Alive)

Processing long audio takes time, and Google Colab might disconnect the runtime due to browser inactivity (usually after 90 minutes). To prevent this while the notebook is running:

1. Open your browser's Developer Console (`F12` on Windows/Linux, or `Cmd + Option + I` on Mac).
2. Navigate to the **Console** tab.
3. Paste the following JavaScript code at the bottom input line and press `Enter`:

```javascript
function KeepClicking(){
   console.log("Keeping session alive...");
   document.querySelector("colab-connect-button").click();
}
setInterval(KeepClicking, 60000);

```

This script will simulate a virtual click every 60 seconds, keeping your session active up to Colab's maximum time limit.

## Output

For each audio file (e.g., `audio1.mp3`), the system will generate two files directly next to the original file in your Drive:

* `audio1_transcription.txt`: The full, clean text transcription.
* `audio1_timestamps.json`: A JSON file containing sentence breakdowns with exact timestamps for timing and synchronization.
