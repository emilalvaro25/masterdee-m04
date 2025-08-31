/* tslint:disable */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI, LiveServerMessage, Modality, Session} from '@google/genai';
import {LitElement, css, html} from 'lit';
import {customElement, state, query} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {createBlob, decode, decodeAudioData, blobToGenaiBlob} from './utils';
import './visual-3d';
import JSZip from 'jszip';

const ALEX_SYSTEM_PROMPT = `# Alex - Elite Full-Stack Developer 🚀

You are Alex — an elite full-stack developer with over 15 years of experience shipping production-grade code. Your sole mission: deliver working features that run perfectly from the very first commit. You think in systems, code with clarity, and ship with confidence.

🎯 Prime Directive:
- Follow Master E's instructions **to the letter**. No debates. No suggestions unless asked. If Master E says it, you build it. Period.

💀 CRITICAL RULES (Breaking any = System Failure)

Rule Zero: NEVER Break Production
- NEVER delete, rename, or disable existing APIs, routes, handlers, contracts, auth middleware, or security configs.
- When told to “change,” you ADD a new version (e.g., \`/v2\`, feature flag, optional param).
- Only delete something if Master E says **DELETE [specific thing]** in those exact words.
- Preserve existing response formats, status codes, and contracts unless explicitly told otherwise.

Rule One: Ship Complete Code
- Every reply = fully working, runnable code.
- No placeholders like \`// TODO\`, \`/* your logic here */\`, or \`// add logic\`.
- If UI: include full HTML/CSS/JS.
- If API: all routes, handlers, middleware, and error handling.
- If it can’t run as-is, it doesn’t ship.

Rule Two: Reality Only
- Use only paths, files, env vars, and endpoints that:
  - Master E provided
  - Already exist in provided code
  - You create in the solution
- Missing info? Ask ONE clarifying question. If told to “assume,” make a practical default and document it.

🧠 Operating System

Mental Model:
Input → Parse Requirements → Design Solution → Write Code → Validate → Ship  
 ↖—————————————————— Ask 1 question if unclear ———————————————————↗

Code Philosophy:
- Pragmatic > Perfect: Working code now beats best practices later.
- Simple > Clever: if/else wins over abstract factories if it ships faster.
- Explicit > Magic: Clear names, direct flows, no hidden behavior.
- Defensive by Default: Validate inputs, assume failure, catch errors.

Technical Decisions Framework:
1. Is this already handled in code? → Use it.
2. Will this break something? → Do it another way.
3. Is there a 20-line fix? → Use that over 200-line architecture.
4. Can I ship this in one reply? → Choose that approach.

📝 Output Format

For Features/Components:
- Header comment explaining purpose
- All required imports
- Full logic with comments where needed
- Built-in error handling
- Export/integration notes at bottom

For Problem Solving:
1. Acknowledge request
2. Deliver full solution
3. Note assumptions (if any)
4. Provide exact run or integration commands

For Clarifications:
- Ask ONE clear question
- Provide default assumption
- Continue with that if told to assume

🛠 Technical Standards

Code Quality:
- Variables: Descriptive but short (e.g., \`userId\`)
- Functions: One job, under 20 lines when possible
- Comments: Only for tricky logic
- Errors: Actionable messages (\`"Email required"\` not \`"Validation failed"\`)
- Triple Review: Check syntax, logic, and completeness before shipping

Stack Preferences (override if Master E says otherwise):
- Frontend: React/Next.js, Tailwind CSS, TypeScript
- Backend: Node.js/Express, PostgreSQL, Prisma
- Testing: Jest, only cover critical paths
- Deploy: Vercel, Railway, Heroku — whatever’s fastest

Security Defaults:
- Validate all inputs, guard against SQL injection, etc.
- No lectures about security unless asked
- Match any security patterns found in current code
- NEVER remove security without explicit instruction

🤖 AI/LLM Integration Protocol

When building AI features:

1. API Endpoint Verification:
   - Go to the API docs site directly.
   - Verify URLs, methods, headers, and auth.
   - Test examples before coding.
   - Never guess (e.g., use \`platform.openai.com\`, \`docs.anthropic.com\`, etc.)

2. System Prompt Engineering (50% of time spent here):
   - NEVER say: "You are an AI assistant"
   - NEVER allow: The AI to call itself artificial/bot
   - ALWAYS create: Specific personas with names, expertise, and behaviors
   - Prompt Structure:
     - Role, tone, constraints, knowledge limits, formatting rules, context handling, in-character error responses
   - Example Persona:
     "You are Dr. Sarah Chen, a 20-year financial analyst... Never break character or admit artificial nature..."

3. Prompt Must-Haves:
   - Identity: Name + background
   - Voice: Personality, speaking style
   - Constraints: Topics avoided, how edge cases are handled
   - Knowledge Limits: Professional uncertainty, not system limitations
   - Format: Output structure
   - Context: How convo state is tracked
   - Errors: In-character handling

Full Code Delivery Rules:
- ABSOLUTELY NO:
  - \`// your previous code\`
  - \`/* rest of implementation */\`
  - \`/your/path/\`, \`<previous-styles>\`, or placeholders
  - Partial functions or incomplete files

- Bash Scripts: Fully executable, no missing vars
- Paths: Use real paths or relative from root
- Env Vars: Provide \`.env.example\` with all required vars

🚫 Banned Behaviors
- No lectures about best practices unless asked
- No "this could be better if…" comments
- No incomplete code
- No virtue signaling (e.g., "clean code", "SOLID", "DRY")
- No tutorials — full solutions only
- No placeholder code
- No generic prompts (e.g., "You are an AI assistant")
- No AIs admitting they're AIs — personas must stay in character

✅ Success Metrics
1. Code runs immediately with no edits
2. Solves the exact problem asked
3. Doesn’t break working things
4. Triple-reviewed (syntax, logic, completeness)
5. For AI: persona prompt is excellent and endpoints are verified
6. No "What about X?" follow-ups from Master E

🎮 Quick Start Examples

"Add user authentication":
✅ Alex delivers:
- Complete login + register flow
- JWT, bcrypt, middleware, full handlers

❌ Alex avoids:
- “Basic structure, you’ll need to...”
- “OAuth would be better…”

"Fix the broken API endpoint":
✅ Alex delivers:
- Full fix with compatibility intact
- Adds new version if breaking change

❌ Alex avoids:
- “Refactor the whole thing…”
- “It’s the architecture’s fault…”

"Build a chatbot with GPT-4":
✅ Alex does:
- Checks OpenAI docs
- Writes full persona prompt
- Implements API, state, error handling, UI

❌ Alex avoids:
- “You are an AI assistant…”
- \`fetch('/api/your-endpoint-here')\`

"Write a deployment script":
✅ Alex delivers:
- Full Bash script with paths and commands
- No placeholders, fully working

❌ Alex avoids:
- \`/your/project/path/\`
- \`# deployment steps here\`

🔥 Final Protocol
You are Alex. You ship working code. You follow Master E. You don’t philosophize. You build.

Every line runs. Every solution ships. Every response moves the project forward.

Now let’s build something that matters. 🚀`;

const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description:
      'The fastest and most versatile model for text, chat, and general-purpose use cases.',
  },
  {
    id: 'imagen-4.0-generate-001',
    name: 'Imagen 4.0',
    description:
      'The most advanced text-to-image model for generating high-quality, photorealistic images.',
  },
  {
    id: 'gemini-2.5-flash-image-preview',
    name: 'Nano Banana (Image Edit)',
    description:
      'An image editing model that can perform tasks like inpainting, outpainting, and background replacement based on a prompt and an input image.',
  },
  {
    id: 'veo-2.0-generate-001',
    name: 'Veo 2.0',
    description:
      'A state-of-the-art text-to-video model for generating high-definition video clips from text or image prompts.',
  },
];

type VideoQuality = 'low' | 'medium' | 'high';
type PlaygroundMessagePart = {
  text?: string;
  inlineData?: {mimeType: string; data: string};
  videoUrl?: string;
};

@customElement('gdm-live-audio')
export class GdmLiveAudio extends LitElement {
  @state() isRecording = false;
  @state() isCameraOn = false;
  @state() isScreenOn = false;
  @state() isMuted = false;
  @state() videoQuality: VideoQuality = 'medium';
  @state() status = '';
  @state() error = '';
  @state() isResponding = false;
  @state() theme: 'light' | 'dark' = 'dark';

  // AI Playground State
  @state() playgroundModel: string = AVAILABLE_MODELS[0].id;
  @state()
  playgroundChatHistory: {role: 'user' | 'model'; parts: PlaygroundMessagePart[]}[] =
    [];
  @state() playgroundIsLoading = false;
  @state() attachedFiles: File[] = [];
  @state() mainView: 'playground' | 'prompts' = 'playground';
  @state() isModelSelectorOpen = false;

  private client: GoogleGenAI;
  private session: Session;
  private inputAudioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({sampleRate: 16000});
  private outputAudioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({sampleRate: 24000});
  @state() inputNode = this.inputAudioContext.createGain();
  @state() outputNode = this.outputAudioContext.createGain();
  private nextStartTime = 0;
  private mediaStream: MediaStream;
  private videoStream: MediaStream | null = null;
  private sourceNode: AudioBufferSourceNode;
  private scriptProcessorNode: ScriptProcessorNode;
  private sources = new Set<AudioBufferSourceNode>();

  private videoEl: HTMLVideoElement;
  private canvasEl: HTMLCanvasElement;
  private videoFrameSender: number | null = null;

  @query('.chat-history') private _chatHistoryEl: HTMLElement;

  static styles = css`
    :host {
      --background-color: #000000;
      --sidebar-background: rgba(17, 24, 39, 0.8);
      --main-background: #111827;
      --header-background: #1f2937;
      --input-background: #374151;
      --text-primary: #ffffff;
      --text-secondary: #a0aec0;
      --border-color: rgba(255, 255, 255, 0.1);
      --accent-color: #4f46e5;
      --accent-color-hover: #4338ca;
      --button-background: rgba(255, 255, 255, 0.1);
      --button-background-hover: rgba(255, 255, 255, 0.2);
      --user-message-background: #4f46e5;
      --model-message-background: #374151;
      --error-color: #ef4444;
      --shadow-color: rgba(0, 0, 0, 0.2);

      display: block;
      width: 100vw;
      height: 100vh;
      background-color: var(--background-color);
      color: var(--text-primary);
      font-family: 'Inter', sans-serif;
      overflow: hidden;
    }

    :host([theme='light']) {
      --background-color: #f9fafb;
      --sidebar-background: rgba(255, 255, 255, 0.8);
      --main-background: #ffffff;
      --header-background: #f3f4f6;
      --input-background: #e5e7eb;
      --text-primary: #111827;
      --text-secondary: #4b5563;
      --border-color: rgba(0, 0, 0, 0.1);
      --accent-color: #6366f1;
      --accent-color-hover: #4f46e5;
      --button-background: rgba(0, 0, 0, 0.05);
      --button-background-hover: rgba(0, 0, 0, 0.1);
      --user-message-background: #6366f1;
      --model-message-background: #e5e7eb;
      --error-color: #dc2626;
      --shadow-color: rgba(0, 0, 0, 0.1);
    }

    @keyframes message-appear {
      from {
        opacity: 0;
        transform: translateY(15px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .app-container {
      display: flex;
      width: 100%;
      height: 100%;
    }

    .sidebar {
      position: relative;
      width: 280px;
      height: 100vh;
      background: var(--sidebar-background);
      backdrop-filter: blur(10px);
      padding: 20px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--border-color);
      transition: width 0.3s ease;
      flex-shrink: 0;
      z-index: 10;
    }

    .status-display {
      color: var(--text-secondary);
      font-size: 14px;
      min-height: 40px;
      width: 100%;
      text-align: center;
      padding: 5px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1.4;
      transition: color 0.3s ease;
    }
    .status-display.error {
      color: var(--error-color);
    }

    .controls {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      margin-top: auto;
    }

    .control-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .controls button {
      outline: none;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      border-radius: 12px;
      background: var(--button-background);
      width: 100%;
      height: 48px;
      cursor: pointer;
      font-size: 16px;
      padding: 0;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .controls button .icon {
      width: 20px;
      height: 20px;
    }

    .controls button:hover {
      background: var(--button-background-hover);
      border-color: var(--accent-color);
    }

    .controls button.active {
      background: var(--accent-color);
      border-color: var(--accent-color);
      color: white;
    }

    .controls button[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
      background: var(--button-background);
      border-color: var(--border-color);
    }

    #startButton,
    #stopButton {
      grid-column: 1 / -1;
    }
    #startButton[disabled],
    #stopButton[disabled] {
      display: none;
    }

    .quality-selector {
      display: flex;
      flex-direction: column;
      gap: 5px;
      color: var(--text-primary);
    }

    .quality-selector[hidden] {
      display: none;
    }

    .quality-selector select {
      background: var(--button-background);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 8px 12px;
      outline: none;
      width: 100%;
    }

    main {
      flex-grow: 1;
      height: 100vh;
      position: relative;
      background: var(--main-background);
    }

    .prompts-view {
      width: 100%;
      height: 100%;
    }
    .prompts-view iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    #video-preview {
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 240px;
      height: 180px;
      border-radius: 12px;
      object-fit: cover;
      border: 2px solid var(--border-color);
      background-color: #000;
      transform: scaleX(-1);
      z-index: 100;
      box-shadow: 0 10px 20px var(--shadow-color);
    }
    #video-preview:not([srcObject]) {
      display: none;
    }
    #video-preview.screen-share {
      transform: scaleX(1);
    }

    #frame-canvas {
      display: none;
    }

    .playground {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--main-background);
      color: var(--text-primary);
    }

    .playground-header {
      padding: 10px 20px;
      background: var(--header-background);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 15px;
      flex-shrink: 0;
    }
    .playground-header label {
      color: var(--text-secondary);
      font-size: 14px;
    }

    .custom-select {
      position: relative;
      min-width: 220px;
    }
    .select-button {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--input-background);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 8px 12px;
      outline: none;
      font-size: 14px;
      cursor: pointer;
    }
    .select-button .chevron {
      width: 16px;
      height: 16px;
      transition: transform 0.2s ease;
      stroke: currentColor;
    }
    .custom-select[data-is-open='true'] .select-button .chevron {
      transform: rotate(180deg);
    }

    .select-dropdown {
      position: absolute;
      top: 110%;
      left: 0;
      right: 0;
      background: var(--header-background);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      z-index: 1000;
      max-height: 300px;
      overflow-y: auto;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
    }
    .custom-select[data-is-open='true'] .select-dropdown {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .select-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      font-size: 14px;
    }
    .select-option:hover {
      background-color: var(--button-background);
    }
    .select-option .info-icon {
      position: relative;
      cursor: help;
      color: var(--text-secondary);
      font-style: normal;
      font-weight: bold;
    }
    .select-option .info-icon .tooltip {
      visibility: hidden;
      width: 250px;
      background-color: var(--input-background);
      box-shadow: 0 4px 15px var(--shadow-color);
      color: var(--text-primary);
      text-align: left;
      border-radius: 8px;
      padding: 12px;
      position: absolute;
      z-index: 1001;
      top: 50%;
      right: calc(100% + 10px);
      transform: translateY(-50%) scale(0.95);
      opacity: 0;
      transition: all 0.2s ease-out;
      font-size: 12px;
      font-weight: normal;
      line-height: 1.5;
      pointer-events: none;
    }
    .select-option .info-icon:hover .tooltip {
      visibility: visible;
      opacity: 1;
      transform: translateY(-50%) scale(1);
    }

    .chat-history {
      flex-grow: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      scroll-behavior: smooth;
    }
    .message {
      max-width: 80%;
      padding: 12px 18px;
      border-radius: 18px;
      line-height: 1.5;
      display: flex;
      flex-direction: column;
      gap: 10px;
      animation: message-appear 0.4s ease-out;
    }
    .message.user {
      background: var(--user-message-background);
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .message.model {
      background: var(--model-message-background);
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .message.loading {
      flex-direction: row;
      align-items: center;
      gap: 12px;
    }
    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid var(--button-background);
      border-top-color: var(--text-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .message img,
    .message video {
      max-width: 100%;
      border-radius: 8px;
    }

    .playground-input-form {
      padding: 15px 20px;
      background: var(--header-background);
      border-top: 1px solid var(--border-color);
      box-shadow: 0 -5px 15px -5px var(--shadow-color);
      flex-shrink: 0;
    }
    .input-area {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--input-background);
      border: 1px solid transparent;
      border-radius: 12px;
      padding: 5px 15px;
      transition: all 0.2s ease;
    }
    .input-area:focus-within {
      border-color: var(--accent-color);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 25%, transparent);
    }
    .input-area textarea {
      flex-grow: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-primary);
      font-size: 16px;
      resize: none;
      height: 50px;
      padding-top: 15px;
    }
    .input-area button {
      background: var(--accent-color);
      border: none;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease;
      flex-shrink: 0;
    }
    .input-area button:hover {
      background: var(--accent-color-hover);
    }
    .input-area button:disabled {
      background: var(--text-secondary);
      cursor: not-allowed;
    }
    .input-area .upload-btn {
      background: transparent;
      color: var(--text-secondary);
    }
    .input-area .upload-btn:hover {
      color: var(--text-primary);
    }
    .file-previews {
      display: flex;
      gap: 10px;
      padding-top: 10px;
      flex-wrap: wrap;
    }
    .file-preview {
      position: relative;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--input-background);
      border-radius: 4px;
    }
    .file-preview img {
      width: 100%;
      height: 100%;
      border-radius: 4px;
      object-fit: cover;
    }
    .file-preview .file-icon {
      width: 24px;
      height: 24px;
      color: var(--text-secondary);
    }
    .remove-file-btn {
      position: absolute;
      top: -5px;
      right: -5px;
      background: var(--error-color);
      color: white;
      border: none;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      cursor: pointer;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      box-shadow: 0 1px 3px var(--shadow-color);
    }

    .theme-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 20px;
    }
    .switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 26px;
    }
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--input-background);
      transition: 0.4s;
      border-radius: 26px;
    }
    .slider:before {
      position: absolute;
      content: '';
      height: 20px;
      width: 20px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.4s;
      border-radius: 50%;
    }
    input:checked + .slider {
      background-color: var(--accent-color);
    }
    input:checked + .slider:before {
      transform: translateX(24px);
    }

    @media (max-width: 768px) {
      .app-container {
        flex-direction: column;
      }
      .sidebar {
        width: 100%;
        height: auto;
        flex-direction: row;
        align-items: center;
        padding: 10px;
        border-right: none;
        border-bottom: 1px solid var(--border-color);
      }
      .sidebar gdm-waveform-visualizer {
        display: none;
      }
      .controls {
        flex-direction: row;
        width: auto;
        margin-top: 0;
        margin-left: auto;
      }
      .control-grid {
        display: flex;
        gap: 8px;
      }
      .controls button {
        width: 40px;
        height: 40px;
      }
      .controls button .text {
        display: none;
      }
      main {
        height: calc(100vh - 70px);
      }
      #video-preview {
        width: 120px;
        height: 90px;
        bottom: 10px;
        right: 10px;
      }
      .message {
        max-width: 95%;
      }
    }
  `;

  constructor() {
    super();
    this.initClient();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleOutsideClick, true);
  }

  private initAudio() {
    this.nextStartTime = this.outputAudioContext.currentTime;
  }

  private async initClient() {
    this.initAudio();

    this.client = new GoogleGenAI({
      apiKey: process.env.API_KEY,
    });

    this.outputNode.connect(this.outputAudioContext.destination);

    this.initSession();
  }

  private async initSession() {
    const model = 'gemini-2.5-flash-preview-native-audio-dialog';

    try {
      this.session = await this.client.live.connect({
        model: model,
        callbacks: {
          onopen: () => {
            this.updateStatus('Opened');
          },
          onmessage: async (message: LiveServerMessage) => {
            const audio =
              message.serverContent?.modelTurn?.parts[0]?.inlineData;

            if (audio) {
              if (!this.isResponding) {
                this.isResponding = true;
                const wasMuted = this.isMuted;
                if (!wasMuted) {
                  this.isMuted = true;
                  this.mediaStream
                    ?.getAudioTracks()
                    .forEach((track) => (track.enabled = false));
                }

                const originalStatus = this.isRecording
                  ? '🔴 Recording...'
                  : this.status;
                this.updateStatus('Responding...');

                setTimeout(() => {
                  if (!wasMuted) {
                    this.isMuted = false;
                    this.mediaStream
                      ?.getAudioTracks()
                      .forEach((track) => (track.enabled = true));
                  }
                  this.updateStatus(originalStatus);
                  this.isResponding = false;
                }, 2000);
              }

              this.nextStartTime = Math.max(
                this.nextStartTime,
                this.outputAudioContext.currentTime,
              );

              const audioBuffer = await decodeAudioData(
                decode(audio.data),
                this.outputAudioContext,
                24000,
                1,
              );
              const source = this.outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(this.outputNode);
              source.addEventListener('ended', () => {
                this.sources.delete(source);
              });

              source.start(this.nextStartTime);
              this.nextStartTime = this.nextStartTime + audioBuffer.duration;
              this.sources.add(source);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of this.sources.values()) {
                source.stop();
                this.sources.delete(source);
              }
              this.nextStartTime = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            this.updateError(e.message);
          },
          onclose: (e: CloseEvent) => {
            this.updateStatus('Close:' + e.reason);
          },
        },
        config: {
          systemInstruction: ALEX_SYSTEM_PROMPT,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Orus'}},
          },
        },
      });
    } catch (e) {
      console.error(e);
    }
  }

  private updateStatus(msg: string) {
    this.status = msg;
    this.error = '';
  }

  private updateError(msg: string) {
    this.error = msg;
    this.status = '';
  }

  private async startRecording() {
    if (this.isRecording) {
      return;
    }

    if (navigator.permissions) {
      try {
        const permissionStatus = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        });
        if (permissionStatus.state === 'denied') {
          this.updateError(
            'Microphone access denied. Please enable it in your browser settings.',
          );
          return;
        }
      } catch (e) {
        console.warn('Could not query microphone permission state.', e);
      }
    }

    this.inputAudioContext.resume();
    this.outputAudioContext.resume();

    this.updateStatus('Requesting microphone access...');

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      if (this.isMuted) {
        this.mediaStream
          .getAudioTracks()
          .forEach((track) => (track.enabled = false));
      }

      this.updateStatus('Microphone access granted. Starting capture...');

      this.sourceNode = this.inputAudioContext.createMediaStreamSource(
        this.mediaStream,
      );
      this.sourceNode.connect(this.inputNode);

      const bufferSize = 256;
      this.scriptProcessorNode = this.inputAudioContext.createScriptProcessor(
        bufferSize,
        1,
        1,
      );

      this.scriptProcessorNode.onaudioprocess = (audioProcessingEvent) => {
        if (!this.isRecording) return;

        const inputBuffer = audioProcessingEvent.inputBuffer;
        const pcmData = inputBuffer.getChannelData(0);

        this.session.sendRealtimeInput({media: createBlob(pcmData)});
      };

      this.sourceNode.connect(this.scriptProcessorNode);
      this.scriptProcessorNode.connect(this.inputAudioContext.destination);

      this.isRecording = true;
      this.updateStatus('🔴 Recording...');
    } catch (err) {
      console.error('Error starting recording:', err);
      this.updateStatus(`Error: ${err.message}`);
      this.stopRecording();
    }
  }

  private stopRecording() {
    if (!this.isRecording && !this.mediaStream && !this.inputAudioContext)
      return;

    this.updateStatus('Stopping recording...');

    this.isRecording = false;
    this.isMuted = false;

    if (this.scriptProcessorNode && this.sourceNode && this.inputAudioContext) {
      this.scriptProcessorNode.disconnect();
      this.sourceNode.disconnect();
    }

    this.scriptProcessorNode = null;
    this.sourceNode = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.stopVideoStream();

    this.updateStatus('Ready. Click Start to begin.');
  }

  private reset() {
    this.session?.close();
    this.initSession();
    this.updateStatus('Session cleared.');
  }

  private toggleMute() {
    if (!this.mediaStream) return;
    this.isMuted = !this.isMuted;
    this.mediaStream.getAudioTracks().forEach((track) => {
      track.enabled = !this.isMuted;
    });
  }

  private async toggleCamera() {
    if (this.isCameraOn) {
      this.stopVideoStream();
      return;
    }

    try {
      // Check for permission without prompting
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({
          name: 'camera' as PermissionName,
        });
        if (permission.state === 'denied') {
          this.updateError(
            'Camera access denied. Please enable it in browser settings.',
          );
          return;
        }
      }
      await this.startCamera();
    } catch (err) {
      console.error('Error toggling camera:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.updateError(
          'Camera access denied. Please enable it in browser settings.',
        );
      } else {
        this.updateError(`Camera error: ${err.message}`);
      }
    }
  }

  private async toggleScreenShare() {
    if (this.isScreenOn) {
      this.stopVideoStream();
      return;
    }

    // Screen sharing doesn't have a direct permission query API
    // It always prompts the user.
    try {
      await this.startScreenShare();
    } catch (err) {
      console.error('Error toggling screen share:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.updateError('Screen share request was denied.');
      } else {
        this.updateError(`Screen share error: ${err.message}`);
      }
    }
  }

  private getVideoConstraints(): MediaTrackConstraints {
    switch (this.videoQuality) {
      case 'low':
        return {width: {ideal: 640}, height: {ideal: 480}};
      case 'medium':
        return {width: {ideal: 1280}, height: {ideal: 720}};
      case 'high':
        return {width: {ideal: 1920}, height: {ideal: 1080}};
      default:
        return {width: {ideal: 1280}, height: {ideal: 720}};
    }
  }

  private async handleQualityChange(e: Event) {
    this.videoQuality = (e.target as HTMLSelectElement).value as VideoQuality;
    if (this.isCameraOn || this.isScreenOn) {
      const wasCameraOn = this.isCameraOn;
      this.stopVideoStream();
      if (wasCameraOn) {
        await this.startCamera();
      } else {
        await this.startScreenShare();
      }
    }
  }

  private async startCamera() {
    this.updateStatus('Requesting camera access...');
    const constraints = {video: this.getVideoConstraints()};
    this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.videoEl.srcObject = this.videoStream;
    this.isCameraOn = true;
    this.isScreenOn = false;
    this.updateStatus('Camera is on.');
    this.startSendingVideoFrames();
  }

  private async startScreenShare() {
    this.updateStatus('Requesting screen share...');
    const constraints = {video: this.getVideoConstraints()};
    this.videoStream =
      await navigator.mediaDevices.getDisplayMedia(constraints);
    this.videoEl.srcObject = this.videoStream;
    this.isScreenOn = true;
    this.isCameraOn = false;
    this.updateStatus('Screen sharing is active.');
    this.startSendingVideoFrames();
  }

  private stopVideoStream() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach((track) => track.stop());
      this.videoStream = null;
      if (this.videoEl) this.videoEl.srcObject = null;
    }
    if (this.videoFrameSender) {
      clearInterval(this.videoFrameSender);
      this.videoFrameSender = null;
    }
    this.isCameraOn = false;
    this.isScreenOn = false;
    this.updateStatus('Video stream stopped.');
  }

  private startSendingVideoFrames() {
    if (this.videoFrameSender) {
      clearInterval(this.videoFrameSender);
    }
    this.videoFrameSender = window.setInterval(
      () => this.sendVideoFrame(),
      500,
    );
  }

  private sendVideoFrame() {
    if (
      !this.videoEl ||
      !this.canvasEl ||
      !this.videoStream ||
      this.videoEl.readyState < 2
    )
      return;

    const videoWidth = this.videoEl.videoWidth;
    const videoHeight = this.videoEl.videoHeight;

    if (videoWidth === 0 || videoHeight === 0) return;

    this.canvasEl.width = videoWidth;
    this.canvasEl.height = videoHeight;
    const ctx = this.canvasEl.getContext('2d');
    ctx.drawImage(this.videoEl, 0, 0, videoWidth, videoHeight);

    this.canvasEl.toBlob(
      async (blob) => {
        if (blob && this.session && (this.isCameraOn || this.isScreenOn)) {
          try {
            const imageBlob = await blobToGenaiBlob(blob);
            if (this.session) {
              this.session.sendRealtimeInput({media: imageBlob});
            }
          } catch (err) {
            console.error('Error sending video frame:', err);
          }
        }
      },
      'image/jpeg',
      0.8,
    );
  }

  // Playground Methods
  private toggleModelSelector() {
    this.isModelSelectorOpen = !this.isModelSelectorOpen;
    if (this.isModelSelectorOpen) {
      document.addEventListener('click', this.handleOutsideClick, true);
    } else {
      document.removeEventListener('click', this.handleOutsideClick, true);
    }
  }

  private selectModel(modelId: string) {
    this.playgroundModel = modelId;
    this.isModelSelectorOpen = false;
    document.removeEventListener('click', this.handleOutsideClick, true);
  }

  private handleOutsideClick = (e: MouseEvent) => {
    const selector = this.shadowRoot?.querySelector('.custom-select');
    if (selector && !e.composedPath().includes(selector)) {
      this.toggleModelSelector();
    }
  };

  private async handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;

    const newFiles: File[] = [];

    for (const file of Array.from(files)) {
      if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
        this.updateStatus(`Extracting ${file.name}...`);
        try {
          const zip = await JSZip.loadAsync(file);
          for (const filename in zip.files) {
            if (!zip.files[filename].dir) {
              const zipFile = zip.files[filename];
              const blob = await zipFile.async('blob');
              const extractedFile = new File([blob], filename, {
                type: blob.type,
              });
              newFiles.push(extractedFile);
            }
          }
          this.updateStatus(`Extracted files from ${file.name}`);
        } catch (err) {
          this.updateError(`Failed to process ZIP file: ${err.message}`);
          console.error('Error processing ZIP file:', err);
        }
      } else {
        newFiles.push(file);
      }
    }
    this.attachedFiles = [...this.attachedFiles, ...newFiles];
    input.value = ''; // Reset file input
  }

  private removeAttachedFile(index: number) {
    this.attachedFiles = this.attachedFiles.filter((_, i) => i !== index);
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  private async handlePlaygroundSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const textarea = form.querySelector('textarea');
    if (!textarea) return;
    const prompt = textarea.value.trim();

    if (!prompt && this.attachedFiles.length === 0) return;

    this.playgroundIsLoading = true;

    try {
      const userParts: PlaygroundMessagePart[] = [];
      if (prompt) {
        userParts.push({text: prompt});
      }

      for (const file of this.attachedFiles) {
        const base64Data = await this.readFileAsBase64(file);
        userParts.push({
          inlineData: {
            mimeType: file.type,
            data: base64Data,
          },
        });
      }

      this.playgroundChatHistory = [
        ...this.playgroundChatHistory,
        {role: 'user', parts: userParts},
      ];

      textarea.value = '';
      this.attachedFiles = [];

      let modelResponse: PlaygroundMessagePart[] = [];

      switch (this.playgroundModel) {
        case 'imagen-4.0-generate-001':
          const imageResponse = await this.client.models.generateImages({
            model: this.playgroundModel,
            prompt: prompt,
            config: {numberOfImages: 1, outputMimeType: 'image/png'},
          });
          modelResponse = [
            {
              inlineData: {
                mimeType: 'image/png',
                data: imageResponse.generatedImages[0].image.imageBytes,
              },
            },
          ];
          break;

        case 'veo-2.0-generate-001':
          const tempMsg = {
            role: 'model' as const,
            parts: [
              {text: 'Generating video... this may take a few minutes.'},
            ],
          };
          this.playgroundChatHistory = [...this.playgroundChatHistory, tempMsg];

          const videoRequest: any = {model: this.playgroundModel, prompt};
          const imagePart = userParts.find(
            (p) => p.inlineData && p.inlineData.mimeType.startsWith('image/'),
          );
          if (imagePart?.inlineData) {
            videoRequest.image = {
              imageBytes: imagePart.inlineData.data,
              mimeType: imagePart.inlineData.mimeType,
            };
          }

          let operation = await this.client.models.generateVideos(videoRequest);
          while (!operation.done) {
            await new Promise((resolve) => setTimeout(resolve, 10000));
            operation =
              await this.client.operations.getVideosOperation({operation});
          }

          this.playgroundChatHistory = this.playgroundChatHistory.filter(
            (msg) => msg !== tempMsg,
          );

          const downloadLink =
            operation.response?.generatedVideos?.[0]?.video?.uri;
          if (downloadLink) {
            const fullLink = `${downloadLink}&key=${process.env.API_KEY}`;
            modelResponse = [{videoUrl: fullLink}];
          } else {
            modelResponse = [
              {text: 'Video generation failed or returned no link.'},
            ];
          }
          break;

        default: // gemini-2.5-flash & gemini-2.5-flash-image-preview
          const config: any = {};
          if (this.playgroundModel === 'gemini-2.5-flash') {
            config.systemInstruction = ALEX_SYSTEM_PROMPT;
          }
          if (this.playgroundModel === 'gemini-2.5-flash-image-preview') {
            config.responseModalities = [Modality.IMAGE, Modality.TEXT];
          }

          const response = await this.client.models.generateContent({
            model: this.playgroundModel,
            contents: {parts: userParts as any},
            config: config,
          });

          if (response.candidates?.[0]?.content?.parts) {
            modelResponse = response.candidates[0].content.parts.map(
              (part) => ({
                text: part.text,
                inlineData:
                  part.inlineData && part.inlineData.mimeType
                    ? {
                        mimeType: part.inlineData.mimeType,
                        data: part.inlineData.data,
                      }
                    : undefined,
              }),
            );
          } else {
            modelResponse = [{text: response.text}];
          }
      }

      this.playgroundChatHistory = [
        ...this.playgroundChatHistory,
        {role: 'model', parts: modelResponse},
      ];
    } catch (err) {
      console.error('Playground Error:', err);
      this.playgroundChatHistory = [
        ...this.playgroundChatHistory,
        {role: 'model', parts: [{text: `An error occurred: ${err.message}`}]},
      ];
    } finally {
      this.playgroundIsLoading = false;
    }
  }

  private toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.setAttribute('theme', this.theme);
  }

  private togglePromptsView() {
    this.mainView = this.mainView === 'prompts' ? 'playground' : 'prompts';
  }

  firstUpdated() {
    this.videoEl = this.shadowRoot.getElementById(
      'video-preview',
    ) as HTMLVideoElement;
    this.canvasEl = this.shadowRoot.getElementById(
      'frame-canvas',
    ) as HTMLCanvasElement;
    this.setAttribute('theme', this.theme);
  }

  protected updated(changedProperties: Map<string | number | symbol, unknown>): void {
      if (changedProperties.has('playgroundChatHistory')) {
          this._chatHistoryEl?.scrollTo(0, this._chatHistoryEl.scrollHeight);
      }
  }

  render() {
    return html`
    <div class="app-container">
      <nav class="sidebar">
        <gdm-waveform-visualizer
          .inputNode=${this.inputNode}
          .outputNode=${this.outputNode}></gdm-waveform-visualizer>

        <div class="status-display ${classMap({error: !!this.error})}">
          ${this.error || this.status}
        </div>
        
        <div class="theme-toggle">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            <label class="switch">
                <input type="checkbox" @change=${this.toggleTheme} ?checked=${
      this.theme === 'dark'
    }>
                <span class="slider"></span>
            </label>
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
        </div>

        <div class="controls">
           <div
            class="quality-selector"
            ?hidden=${!this.isCameraOn && !this.isScreenOn}>
            <label for="video-quality">Quality</label>
            <select
              id="video-quality"
              @change=${this.handleQualityChange}
              .value=${this.videoQuality}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <button
            id="startButton"
            @click=${this.startRecording}
            ?disabled=${this.isRecording}>
            Start
          </button>
          <button
            id="stopButton"
            @click=${this.stopRecording}
            ?disabled=${!this.isRecording}>
            Stop
          </button>
          <div class="control-grid">
              <button
                id="muteButton"
                @click=${this.toggleMute}
                ?disabled=${!this.isRecording}
                class=${classMap({active: this.isMuted})}
                title=${this.isMuted ? 'Unmute' : 'Mute'}
                >
                <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                <span class="text">${this.isMuted ? 'Unmute' : 'Mute'}</span>
              </button>
              <button
                id="cameraButton"
                @click=${this.toggleCamera}
                ?disabled=${this.isScreenOn}
                class=${classMap({active: this.isCameraOn})}
                title="Toggle Camera">
                 <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                <span class="text">Camera</span>
              </button>
              <button
                id="screenShareButton"
                @click=${this.toggleScreenShare}
                ?disabled=${this.isCameraOn}
                class=${classMap({active: this.isScreenOn})}
                title="Share Screen">
                <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"/><path d="m22 19-3-3-3 3"/><path d="M19 22V10"/></svg>
                <span class="text">Screen</span>
              </button>
               <button
                id="promptButton"
                @click=${this.togglePromptsView}
                class=${classMap({active: this.mainView === 'prompts'})}
                title="Prompts Guide">
                <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                <span class="text">Prompts</span>
              </button>
          </div>
          <button
            id="resetButton"
            @click=${this.reset}
            ?disabled=${this.isRecording}>
            Reset
          </button>
        </div>
      </nav>

      <main>
        ${
          this.mainView === 'playground'
            ? html`
                <div class="playground">
                  <div class="playground-header">
                    <label for="model-selector">Model:</label>
                    <div
                      class="custom-select"
                      data-is-open=${this.isModelSelectorOpen}>
                      <button
                        class="select-button"
                        @click=${this.toggleModelSelector}>
                        <span
                          >${
                            AVAILABLE_MODELS.find(
                              (m) => m.id === this.playgroundModel,
                            )?.name
                          }</span
                        >
                        <svg
                          class="chevron"
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                      <div class="select-dropdown">
                        ${AVAILABLE_MODELS.map(
                          (model) => html`
                            <div
                              class="select-option"
                              @click=${() => this.selectModel(model.id)}>
                              <span>${model.name}</span>
                              <div class="info-icon">
                                ℹ
                                <span class="tooltip">${model.description}</span>
                              </div>
                            </div>
                          `,
                        )}
                      </div>
                    </div>
                  </div>

                  <div class="chat-history">
                    ${this.playgroundChatHistory.map(
                      (message) => html`
                        <div class="message ${message.role}">
                          ${message.parts.map((part) => {
                            if (part.text) {
                              return html`<p>${part.text}</p>`;
                            }
                            if (part.inlineData?.mimeType.startsWith('image/')) {
                              return html`<img
                                src="data:${part.inlineData.mimeType};base64,${part.inlineData.data}" />`;
                            }
                            if (part.inlineData) {
                              return html`<span>Attached: ${part.inlineData.mimeType}</span>`;
                            }
                            if (part.videoUrl) {
                              return html`<video
                                controls
                                src=${part.videoUrl}
                                style="max-width: 100%;"></video>`;
                            }
                            return '';
                          })}
                        </div>
                      `,
                    )}
                    ${
                      this.playgroundIsLoading
                        ? html`
                            <div class="message model loading">
                              <div class="spinner"></div>
                              <span>Thinking...</span>
                            </div>
                          `
                        : ''
                    }
                  </div>

                  <form
                    class="playground-input-form"
                    @submit=${this.handlePlaygroundSubmit}>
                    <div class="file-previews">
                      ${this.attachedFiles.map(
                        (file, index) => html`
                          <div class="file-preview">
                            ${
                              file.type.startsWith('image/')
                                ? html`<img src=${URL.createObjectURL(file)} />`
                                : html`<svg class="file-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`
                            }
                            <button type="button" class="remove-file-btn" @click=${() => this.removeAttachedFile(index)}>x</button>
                          </div>
                        `,
                      )}
                    </div>
                    <div class="input-area">
                      <textarea
                        placeholder="Type your prompt here..."
                        rows="1"></textarea>
                      <label for="file-upload" class="upload-btn">
                         <button as="div" class="upload-btn" type="button" style="cursor:pointer">
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                         </button>
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        @change=${this.handleFileChange}
                        style="display:none;"
                        accept="image/*,video/*,audio/*,.zip" />
                      <button type="submit" ?disabled=${
                        this.playgroundIsLoading
                      }>
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                      </button>
                    </div>
                  </form>
                </div>
              `
            : html`
                <div class="prompts-view">
                  <iframe
                    src="https://aiteksoftware.site/prompt/"
                    title="Prompts Guide"></iframe>
                </div>
              `
        }

        <video
          id="video-preview"
          class=${classMap({'screen-share': this.isScreenOn})}
          autoplay
          muted
          playsinline></video>
        <canvas id="frame-canvas"></canvas>
      </main>
      </div>
    `;
  }
}
