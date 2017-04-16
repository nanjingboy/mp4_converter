"use strict"

const fs = require("fs")
const tmp = require("tmp")
const path = require("path")
const shell = require("shelljs")
const colors = require("colors")
const ffmpeg = require("ffmpeg")

class Converter {

  static convert(input, output, size) {
    try {
      new ffmpeg(input, (error, video) => {
        if (error) {
          this.error(input)
        }
        let videoList = []
        const seconds = video.metadata.duration.seconds
        const tmpDir = tmp.dirSync({ mode: "0750", prefix: 'video_converter_' }).name
        for (let position = 0; position <= seconds; position += 60) {
          let command
          const index =  videoList.length + 1
          const videoPath = path.join(tmpDir, `${index}.mp4`)
          if (size === 'default') {
            command = `ffmpeg -i ${input} -vcodec libx264 -acodec aac -ss ${position} -t 60 ${videoPath}`
          } else {
            command = `ffmpeg -i ${input} -vcodec libx264 -acodec aac -s ${size} -ss ${position} -t 60 ${videoPath}`
          }
          console.log(`[${`Convert Part ${index}`.green}] ${input}`)
          if (shell.exec(command, { silent: true }).code !== 0) {
            this.error(input)
          }
          videoList.push(`file ${videoPath}`)
        }
        const videoListPath = path.join(tmpDir, "list")
        if (fs.existsSync(output)) {
          fs.unlinkSync(output)
        }
        fs.writeFileSync(videoListPath, videoList.join("\n"), 'utf8')
        console.log(`[${"Concat Parts to".green}] ${output}`)
        if (shell.exec(`ffmpeg -f concat -safe 0  -i ${videoListPath} -c copy ${output}`, { silent: true }).code !== 0) {
          this.error(input)
        }
      })
    } catch(e) {
      this.error(input)
    }
  }

  static error(input) {
    console.log(`[${"Convert Error".red}] ${input}`)
    process.exit(1)
  }
}

module.exports = Converter