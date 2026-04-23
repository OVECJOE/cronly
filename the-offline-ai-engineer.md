# The Offline AI Engineer
### From API Consumer to Model Architect

---

## Table of Contents

**Foreword** — Who this book is for and the mental model that runs through it

---

**Chapter 1 — Foundations: How Small Models Think**
- 1.1 The Transformer in Plain English
- 1.2 The Scale Spectrum
- 1.3 What Fine-Tuning Actually Does
- 1.4 The Three Jobs of a Small AI System
- 1.5 The Vocabulary of This Book
- 1.6 Your Development Environment

**Chapter 2 — The Dataset: Teaching the Model What You Know**
- 2.1 The Mental Model: Data Is the Curriculum
- 2.2 Dataset Formats
- 2.3 Generating Synthetic Data
- 2.4 Sourcing Real Data
- 2.5 Dataset Size Guidelines
- 2.6 The Train/Validation/Test Split
- 2.7 Data Quality Checks

**Chapter 3 — Fine-Tuning: Making the Generalist a Specialist**
- 3.1 The Mental Model: Gradient Descent as Error Correction
- 3.2 Choosing the Right Base Model
- 3.3 Full Fine-Tuning: The Complete Script
- 3.4 LoRA: Fine-Tuning Without Touching Most of the Weights
- 3.5 Reading the Loss Curve
- 3.6 Classification: A Different Task, Same Approach

**Chapter 4 — Quantization: Compressing Intelligence**
- 4.1 The Mental Model: Precision vs. Size
- 4.2 The Quantization Spectrum
- 4.3 Post-Training Quantization (PTQ)
- 4.4 Quantization-Aware Training (QAT)
- 4.5 Verifying Quantization Quality
- 4.6 Size Optimisation Checklist

**Chapter 5 — Browser Inference: The Model Moves In**
- 5.1 The Mental Model: The Browser as a Runtime
- 5.2 Transformers.js: Your Browser Inference Engine
- 5.3 Hosting Your Model
- 5.4 The Complete Browser Inference Setup
- 5.5 Caching Strategy: Offline First
- 5.6 WebGPU: GPU Acceleration in the Browser
- 5.7 Performance Profiling

**Chapter 6 — Mobile Deployment: Models in Your Pocket**
- 6.1 The Mental Model: Constrained Resources, High Expectations
- 6.2 React Native with ONNX Runtime
- 6.3 Native iOS / Android: CoreML and NNAPI
- 6.4 Bundling vs. Downloading: The Size Decision
- 6.5 The Graceful Degradation Pattern

**Chapter 7 — AI Systems: Combining Small Models Into Large Intelligence**
- 7.1 The Mental Model: The Compound Machine
- 7.2 Retrieval-Augmented Generation (RAG) at the Edge
- 7.3 Model Cascades: Fast Path, Slow Path
- 7.4 Specialisation vs. Generalisation Trade-off

**Chapter 8 — MemPalace in the Browser: A Detailed Analysis**
- 8.1 What MemPalace Is
- 8.2 The Browser Compatibility Analysis
- 8.3 Browser-Native MemPalace: The Implementation Path
- 8.4 Performance Characteristics of Browser MemPalace
- 8.5 The Honest Assessment

**Chapter 9 — Production: End to End**
- 9.1 The Complete Pipeline
- 9.2 Model Versioning and Updates
- 9.3 The Privacy Architecture
- 9.4 Testing Your AI System
- 9.5 The Skills You Now Have
- 9.6 What to Build Next
- 9.7 The Frontier

---

**Appendix A** — Quick-Reference Command Sheet  
**Appendix B** — Model Compatibility Matrix  
**Appendix C** — Troubleshooting Guide  
**Appendix D** — Recommended Learning Path  
**Appendix E** — Key Resources
-e 

---


# The Offline AI Engineer
## From API Consumer to Model Architect — Building Intelligent Systems That Run Anywhere

---

> *"The best AI system is one that works when the internet doesn't."*

---

### Who This Book Is For

You are a fullstack engineer. You know how to build things that work. You have called an AI API — OpenAI, Anthropic, Gemini — and marvelled at what comes back. But you have also felt the frustration of that dependency: the latency, the cost per token, the privacy implications of sending user data to a third-party server, and the hard stop when the internet goes away.

This book is your path from *API consumer* to *AI systems engineer*. By the end, you will be able to:

- Take a generic pretrained model and transform it into a specialist that knows your domain cold
- Compress that specialist until it fits in a browser tab
- Ship it inside a web app or mobile app so it works completely offline
- Reason clearly about the tradeoffs between model size, accuracy, speed, and memory

You do not need a PhD. You need a fullstack engineer's instinct — knowing that every system is a pipeline, every component has a contract, and the job is to make the pipeline fast and correct. AI engineering at the small-model level is exactly that kind of work.

---

### The Mental Model That Runs Through This Book

Think of a large pretrained model as a **brilliant generalist** — someone who has read the entire internet, can discuss anything, but has no deep commitment to any one domain. They know a little about cron expressions, a little about surgery, a little about contract law.

Fine-tuning is **hiring that generalist and giving them three months of deep domain immersion**. You do not rewire their brain — you extend it. After those three months, when you ask them a cron question, they answer as a specialist: fast, precise, no hedging.

Quantization is **asking that specialist to take notes in shorthand instead of longhand**. The knowledge is the same. The notebook is smaller. The reading is slightly harder, but not meaningfully so — and it now fits in a pocket.

Inference in the browser is **putting that specialist in the room with the user** rather than routing every question through a call centre in the cloud. No latency. No data leaving the room. Works on a plane.

That is the arc of this book. Generalist → Specialist → Compressed → Deployed.

---

### How to Read This Book

Each chapter follows the same structure:

1. **The mental model** — why this step exists and what it is doing conceptually
2. **The diagram** — a visual representation of the data flow or architecture
3. **The code** — short, annotated snippets with explanations of the reasoning behind each line
4. **The experiment** — something you can run yourself to build intuition
5. **The tradeoffs** — what you give up and what you gain at each decision point

You should have Python 3.10+ and Node.js 18+ installed. A GPU is helpful but not required for the small models we work with — everything in this book runs on a MacBook or a free Google Colab session.

---

### A Note on MemPalace

At the end of this book, we examine [MemPalace](https://github.com/MemPalace/mempalace) — a retrieval-augmented memory system — and answer a specific question: can it run in the browser? The answer is nuanced and worth reading carefully. We will get there.

---

*Let us begin.*
-e 

---


# Chapter 1 — Foundations: How Small Models Think

## 1.1 The Transformer in Plain English

Before you can train one, you need a working mental model of what a transformer is doing. Not the mathematics — the *intent*.

A transformer is a machine that learns relationships between tokens. A token is a chunk of text — roughly a word, sometimes a syllable, sometimes a punctuation mark. The transformer reads a sequence of tokens and produces either a prediction of what comes next (language modelling) or a transformed sequence (translation, summarisation, cron generation).

The key insight is the **attention mechanism**: every token in the sequence looks at every other token and decides how much to "pay attention" to it when computing its own meaning. The word "bank" attends strongly to "river" in one sentence and strongly to "money" in another. That context-sensitivity is what makes transformers powerful.

```
Input:  "every weekday at 9am"
         │        │      │   │
         └────────┼──────┼───┘  ← tokens attending to each other
                  │      │
         [attention weights computed]
                  │
Output: "0 9 * * 1-5"
```

The weights that govern this attention — billions of floating-point numbers — are what get stored in a model file. Training is the process of adjusting those weights until the model produces correct outputs for your inputs.

---

## 1.2 The Scale Spectrum

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MODEL SCALE SPECTRUM                         │
├──────────────┬──────────────┬──────────────┬────────────────────────┤
│   GPT-4      │  Llama-3 70B │  Phi-3 Mini  │  flan-t5-small         │
│  ~1.7T param │   70B param  │   3.8B param │   77M param            │
│   ~1TB VRAM  │  ~140GB VRAM │   ~2.5GB RAM │   ~300MB RAM           │
│   API only   │ Local w/ GPU │ Local laptop │ Browser / mobile       │
│  Generalist  │  Generalist  │  Semi-spec.  │  Specialist after FT   │
└──────────────┴──────────────┴──────────────┴────────────────────────┘
                                                        ▲
                                              This book lives here
```

We are working at the far right of this spectrum. The models we care about are:

| Model | Params | Quantized Size | Best For |
|-------|--------|----------------|----------|
| `flan-t5-small` | 77M | ~30MB | Text→text tasks (translation, generation) |
| `flan-t5-base`  | 250M | ~100MB | More complex text→text |
| `distilbert-base` | 66M | ~25MB | Classification, NER, QA |
| `phi-3-mini` (4-bit) | 3.8B | ~2.3GB | Instruction following (edge of browser) |
| `MobileViT-small` | 5.7M | ~20MB | Image classification |
| `whisper-tiny` | 39M | ~15MB | Speech-to-text |

These are not toy models. Fine-tuned correctly on a specific task, a 77M-parameter model can outperform GPT-4 on that task because it has *committed* to it rather than hedging across every domain.

---

## 1.3 What Fine-Tuning Actually Does

Here is the most important mental model in this book.

A pretrained model has learned a compressed representation of human language — it understands grammar, semantics, and world knowledge from training on hundreds of billions of tokens. This learning lives in the model weights.

Fine-tuning does **not** erase this knowledge. It *steers* it.

```
BEFORE FINE-TUNING (weights W₀):
  Input: "every weekday at 9am"
  Output: "Working weekdays are typically from 9am to 5pm..."
           ← general language completion

AFTER FINE-TUNING (weights W₁ = W₀ + ΔW):
  Input: "every weekday at 9am"
  Output: "0 9 * * 1-5"
           ← specialist task completion
```

The change `ΔW` is small relative to the full weights. The model has learned a new skill on top of its existing knowledge, not replaced it.

This is why fine-tuning is so much cheaper than pretraining. Pretraining might take 10,000 GPU-hours. Fine-tuning the same model for a specific task might take 20 GPU-minutes.

---

## 1.4 The Three Jobs of a Small AI System

Every small AI system you build will have three distinct components:

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR AI SYSTEM                        │
│                                                         │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────┐  │
│  │  PRE-PROCESS│──▶│    MODEL     │──▶│POST-PROCESS │  │
│  │             │   │              │   │             │  │
│  │ Tokenise    │   │ Forward pass │   │ Validate    │  │
│  │ Normalise   │   │ (inference)  │   │ Normalise   │  │
│  │ Prompt-eng. │   │              │   │ Format      │  │
│  └─────────────┘   └──────────────┘   └─────────────┘  │
│         │                 │                   │         │
│    "every day       weights.onnx        "0 0 * * *"    │
│      at midnight"    (30MB file)        validated ✓     │
└─────────────────────────────────────────────────────────┘
```

A common mistake for engineers new to AI is assuming the model does all the work. In practice, pre-processing (how you frame the input) and post-processing (how you validate and use the output) are often where the difference between 70% and 99% accuracy lives.

We will return to this in every chapter.

---

## 1.5 The Vocabulary of This Book

Before we go further, lock in these definitions. They will appear constantly:

**Token** — the atomic unit of text a model processes. "hello" → 1 token; "antidisestablishmentarianism" → ~6 tokens.

**Parameters / weights** — the numbers that define a model's behaviour. More parameters = more capacity to represent complex patterns.

**Pretraining** — training a model from scratch on a massive general corpus. Done by research labs. Not your job.

**Fine-tuning** — adjusting a pretrained model's weights on your specific dataset. This is your main job.

**Inference** — running a trained model on new inputs to get predictions. What users experience.

**Quantization** — compressing model weights from 32-bit floats to 8-bit or 4-bit integers to reduce file size and memory usage with minimal accuracy loss.

**ONNX** — Open Neural Network Exchange format. A universal file format for AI models that any runtime (including the browser) can execute.

**Transformers.js** — a JavaScript library that runs ONNX models in the browser, using WebAssembly or WebGPU as the execution backend.

**LoRA** — Low-Rank Adaptation. A fine-tuning technique that changes only a small subset of weights, making training even cheaper.

---

## 1.6 Your Development Environment

You need two environments: a Python environment for training and a JavaScript environment for deployment.

```bash
# Python environment (training)
python -m venv .venv
source .venv/bin/activate

pip install torch transformers datasets accelerate \
            optimum[exporters] evaluate sacrebleu

# Verify
python -c "import transformers; print(transformers.__version__)"
# Expected: 4.40+
```

```bash
# JavaScript environment (deployment)
node -v  # 18+

npm install @xenova/transformers
# This is Transformers.js — the browser inference runtime
```

If you have a GPU:
```bash
pip install torch --index-url https://download.pytorch.org/whl/cu121
# CUDA 12.1 — adjust for your CUDA version
```

If you don't (CPU only, perfectly fine for small models):
```bash
pip install torch  # defaults to CPU-only build
```

---

*In the next chapter, we build your first specialist model end to end — from dataset to browser — in about 45 minutes of GPU time.*
-e 

---


# Chapter 2 — The Dataset: Teaching the Model What You Know

## 2.1 The Mental Model: Data Is the Curriculum

If fine-tuning is sending a generalist through domain immersion, then your dataset is the curriculum. A well-designed curriculum produces a specialist. A poorly-designed one produces a confused generalist who has forgotten what it used to know.

The three properties of a good fine-tuning dataset are:

```
┌─────────────────────────────────────────────────────────┐
│              DATASET QUALITY TRIANGLE                    │
│                                                         │
│                    CONSISTENCY                          │
│                        ▲                               │
│                       / \                              │
│                      /   \                             │
│                     /     \                            │
│                    /       \                           │
│          COVERAGE ◄─────────► CORRECTNESS              │
│                                                        │
│  COVERAGE    — do your examples span the input space?  │
│  CORRECTNESS — are your outputs actually right?        │
│  CONSISTENCY — do similar inputs always get the same   │
│                style of output?                        │
└─────────────────────────────────────────────────────────┘
```

You can survive low coverage with a smaller model. You cannot survive low correctness or low consistency — the model will learn your mistakes as faithfully as it learns your knowledge.

---

## 2.2 Dataset Formats

HuggingFace's `datasets` library expects your data in one of a few shapes. The one we use throughout this book is **JSONL** (JSON Lines) — one JSON object per line:

```jsonl
{"input": "every weekday at 9am", "output": "0 9 * * 1-5"}
{"input": "every 15 minutes",     "output": "*/15 * * * *"}
{"input": "first day of the month at midnight", "output": "0 0 1 * *"}
```

For classification tasks, the format changes slightly:

```jsonl
{"text": "This product broke after two days", "label": "negative"}
{"text": "Absolutely love this, works perfectly", "label": "positive"}
```

For question-answering:

```jsonl
{"question": "What is the capital of France?", "context": "France is a country in Western Europe. Its capital is Paris.", "answer": "Paris"}
```

The format matters because it determines your tokenization strategy. We will see this in practice shortly.

---

## 2.3 Generating Synthetic Data

For many specialist tasks, you do not have labelled data — you have domain knowledge. The fastest path from domain knowledge to a dataset is **programmatic generation**.

```
DOMAIN KNOWLEDGE
      │
      ▼
┌─────────────────┐
│ Generator script│  ← You write this once
│                 │
│  for each       │
│  (pattern,      │
│   parameter):   │
│    emit example │
└─────────────────┘
      │
      ▼
training.jsonl  (10k-200k examples in minutes)
```

Here is a generator for a hypothetical customer intent classifier:

```python
# generate_intent_data.py
# Mental model: we enumerate every intent × every phrasing variation.
# The cross-product of intents and phrasings gives us coverage cheaply.

import json
import random

INTENTS = {
    "cancel_subscription": [
        "I want to cancel",
        "cancel my subscription",
        "I'd like to stop my plan",
        "please cancel my account",
        "how do I cancel?",
        "unsubscribe me",
        "I don't want to continue",
        "stop billing me",
    ],
    "request_refund": [
        "I want my money back",
        "please refund me",
        "I'd like a refund",
        "can I get a refund?",
        "charge me back",
        "I was charged incorrectly",
        "reverse the payment",
    ],
    "technical_support": [
        "it's not working",
        "something is broken",
        "I have a bug",
        "the app crashed",
        "I can't log in",
        "error message on my screen",
        "nothing loads",
    ],
}

# Prefixes and suffixes add variation without changing meaning.
# This teaches the model to be invariant to politeness, urgency, etc.
PREFIXES = ["", "Hi, ", "Hello, ", "Hey, ", "Excuse me, ", "Quick question — "]
SUFFIXES = ["", ".", " please.", " thanks.", " asap.", " urgently."]

examples = []
for intent, phrases in INTENTS.items():
    for phrase in phrases:
        for prefix in PREFIXES:
            for suffix in SUFFIXES:
                text = f"{prefix}{phrase}{suffix}".strip()
                examples.append({"text": text, "label": intent})

# Shuffle so the model doesn't see all examples of one class in a row
random.shuffle(examples)

with open("intent_data.jsonl", "w") as f:
    for ex in examples:
        f.write(json.dumps(ex) + "\n")

print(f"Generated {len(examples)} examples")
# For 3 intents × 8 phrases × 6 prefixes × 5 suffixes = 720 examples
# Add more intents and phrases to scale up
```

**Why this works:** Small models learn from repetition. Seeing "cancel my subscription" in 30 different surface forms teaches the model that the *intent* matters, not the exact phrasing. This is called **invariance** — the model learns to be robust to surface variation.

---

## 2.4 Sourcing Real Data

Synthetic data covers your known patterns. Real data covers the unknown unknowns — the phrasing your users actually use that you never would have thought of.

Sources, in order of quality:

```
┌──────────────────────────────────────────────────┐
│              DATA SOURCE QUALITY LADDER           │
│                                                  │
│  HIGHEST  ████████████  Real user data           │
│           ████████████  (labelled by humans)     │
│                                                  │
│           ██████████    Human-written examples   │
│           ██████████    (by domain experts)      │
│                                                  │
│           ████████      LLM-generated, human-    │
│           ████████      verified examples        │
│                                                  │
│           ██████        LLM-generated, spot-     │
│           ██████        checked examples         │
│                                                  │
│  LOWEST   ████          Fully synthetic with     │
│           ████          no human review          │
└──────────────────────────────────────────────────┘
```

For a production system, the ideal pipeline is:

1. Generate synthetic data programmatically (fast, cheap, broad coverage)
2. Have a domain expert review a sample and fix systematic errors
3. Collect real user inputs as the product is used
4. Relabel misclassified real inputs and add them to the dataset
5. Retrain periodically as the dataset grows

---

## 2.5 Dataset Size Guidelines

A question every engineer asks: *how much data do I need?*

```
┌─────────────────────────────────────────────────────────┐
│              DATASET SIZE GUIDELINES                     │
│                                                         │
│  Task Type          Min Examples   Good      Excellent  │
│  ─────────────────  ────────────   ────────  ────────── │
│  Binary classifier  500            5,000     50,000     │
│  Multi-class (10)   1,000          10,000    100,000    │
│  Text generation    2,000          20,000    200,000    │
│  Structured output  1,000          10,000    50,000     │
│  (like cron expr.)                                      │
│                                                         │
│  Rule of thumb: 100 examples per output class minimum.  │
│  More is almost always better up to ~200k, then         │
│  diminishing returns unless diversity increases too.     │
└─────────────────────────────────────────────────────────┘
```

---

## 2.6 The Train/Validation/Test Split

Never train on all your data. Always hold out examples the model never sees during training so you can measure real performance.

```python
# split_dataset.py
# Mental model: the test set is sacred. Touch it exactly once,
# at the very end, to report your final number. Everything else
# uses the validation set for decision-making.

from datasets import load_dataset

ds = load_dataset("json", data_files="training.jsonl", split="train")

# 90% train, 5% validation, 5% test
splits = ds.train_test_split(test_size=0.1, seed=42)
train_val = splits["train"].train_test_split(test_size=0.056, seed=42)
# 0.056 of 90% ≈ 5% of total

dataset = {
    "train":      train_val["train"],   # 90% — model learns from this
    "validation": train_val["test"],    # 5%  — you tune hyperparams on this
    "test":       splits["test"],       # 5%  — you report final accuracy on this
}

print(f"Train: {len(dataset['train'])}")
print(f"Valid: {len(dataset['validation'])}")
print(f"Test:  {len(dataset['test'])}")
```

**The golden rule:** once you look at test set performance, stop changing the model. If you keep tweaking based on test results, you are inadvertently training on the test set — and your reported accuracy will be optimistic.

---

## 2.7 Data Quality Checks

Before training, always audit your dataset programmatically. Bugs in data are far cheaper to fix before training than after.

```python
# audit_dataset.py
# Mental model: think of this as a type checker for your data.
# Every example should satisfy a contract.

import json
from collections import Counter

examples = [json.loads(l) for l in open("training.jsonl")]

# 1. Check for empty inputs
empty_inputs = [e for e in examples if not e.get("input", "").strip()]
print(f"Empty inputs: {len(empty_inputs)}")  # should be 0

# 2. Check for empty outputs
empty_outputs = [e for e in examples if not e.get("output", "").strip()]
print(f"Empty outputs: {len(empty_outputs)}")  # should be 0

# 3. Check class balance (for classification)
if "label" in examples[0]:
    counts = Counter(e["label"] for e in examples)
    print("\nClass distribution:")
    for label, count in sorted(counts.items(), key=lambda x: -x[1]):
        bar = "█" * (count // max(counts.values()) * 30 // 1)
        print(f"  {label:30s} {count:6d}  {bar}")

# 4. Check for duplicates
inputs = [e.get("input", e.get("text", "")) for e in examples]
unique = len(set(inputs))
print(f"\nTotal: {len(inputs)}, Unique: {unique}, Dupes: {len(inputs) - unique}")

# 5. Check input length distribution
lengths = [len(inp.split()) for inp in inputs]
print(f"\nInput length — min: {min(lengths)}, max: {max(lengths)}, avg: {sum(lengths)/len(lengths):.1f}")
```

---

*In the next chapter, we take this dataset and perform the actual fine-tuning — running training loops, monitoring loss curves, and knowing when to stop.*
-e 

---


# Chapter 3 — Fine-Tuning: Making the Generalist a Specialist

## 3.1 The Mental Model: Gradient Descent as Error Correction

Training is a feedback loop. The model makes a prediction. You measure how wrong it is. You adjust the weights slightly to make it less wrong. Repeat millions of times.

```
┌─────────────────────────────────────────────────────────────┐
│                    THE TRAINING LOOP                         │
│                                                             │
│   ┌──────────┐   predict   ┌──────────┐   measure          │
│   │  Model   │────────────▶│  Output  │──────────┐         │
│   │ (weights)│             │          │          ▼          │
│   └──────────┘             └──────────┘    ┌──────────┐    │
│        ▲                                   │   Loss   │    │
│        │                                   │ (how     │    │
│   adjust weights                           │  wrong?) │    │
│   (backprop)                               └──────────┘    │
│        │                                        │          │
│        └────────────────────────────────────────┘          │
│                                                             │
│   One pass through all training examples = 1 epoch         │
│   Typically train for 3-10 epochs on fine-tuning tasks     │
└─────────────────────────────────────────────────────────────┘
```

The **loss** is a number that measures wrongness. A loss of 0 means the model is perfectly predicting every output. A high loss means it is wrong often. Training pushes the loss down.

**Overfitting** is when the loss on training data keeps falling but the loss on validation data starts rising — the model has memorised the training examples rather than learning the underlying pattern. This is the primary failure mode to watch for.

```
        Loss
          │
     high │╲
          │ ╲ Training loss
          │  ╲___________
          │              ╲____  ← keep training: still generalising
          │                   ╲____
          │  Validation loss
          │╲
          │ ╲______________
          │               ╲____╱╲  ← OVERFITTING starts here
          │                       ╲
          └────────────────────────────────── Epochs
```

Stop training when validation loss stops improving. This is called **early stopping**.

---

## 3.2 Choosing the Right Base Model

Your choice of base model determines the ceiling of your specialist's capability. Here are the models we recommend for browser/mobile deployment:

```
TASK TYPE              RECOMMENDED BASE MODEL        WHY
─────────────────────  ───────────────────────────   ──────────────────────────
Text → Text            google/flan-t5-small (77M)    Best instruction-following
(structured output)    google/flan-t5-base  (250M)   at small scale

Text classification    distilbert-base-               Fast, accurate,
                       uncased (66M)                  well-studied

Named entity recog.    dslim/bert-base-NER (110M)    Pre-trained on NER

Sentence similarity    sentence-transformers/         Produces embeddings,
                       all-MiniLM-L6-v2 (22M)        great for search/RAG

Speech to text         openai/whisper-tiny (39M)     English only is fine
                       openai/whisper-base (74M)     Multilingual

Image classification   google/mobilenet_v2 (3.4M)   Tiny, accurate
                       microsoft/dit-base (86M)       Document understanding
```

**For the cron engine we built in the Cronly project**, the right choice is `google/flan-t5-small`. It was pretrained with instruction-following in mind, so it responds well to prompts like "Convert this schedule to a cron expression:".

---

## 3.3 Full Fine-Tuning: The Complete Script

Here is a production-grade fine-tuning script with every decision explained:

```python
# finetune.py
# Mental model: this script is a controlled experiment.
# Every hyperparameter is a decision you can explain.

import torch
from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,          # T5-style models are seq2seq
    Seq2SeqTrainer,
    Seq2SeqTrainingArguments,
    DataCollatorForSeq2Seq,
    EarlyStoppingCallback,
)
from datasets import load_dataset
import evaluate
import numpy as np

# ── Configuration ─────────────────────────────────────────────────────────────
# All magic numbers in one place. Change here, not scattered through the script.

MODEL_NAME  = "google/flan-t5-small"
DATA_FILE   = "training.jsonl"
OUTPUT_DIR  = "checkpoints/my-specialist"
MAX_INPUT   = 128    # max tokens in input. 128 is generous for most tasks.
MAX_OUTPUT  = 32     # max tokens in output. Cron expressions are short.
BATCH_SIZE  = 32     # how many examples per gradient update
EPOCHS      = 10     # max epochs (early stopping will halt sooner)
LR          = 3e-4   # learning rate. 1e-4 to 5e-4 works well for T5 fine-tuning
WARMUP      = 200    # steps before LR reaches its target (prevents early instability)

# ── Load tokenizer and model ──────────────────────────────────────────────────
# The tokenizer converts text to token IDs. It is fixed — we do not change it.
# The model weights are what we update during training.

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model     = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)

print(f"Model parameters: {model.num_parameters():,}")
# flan-t5-small: 77,027,328 — manageable!

# ── Load and tokenize dataset ─────────────────────────────────────────────────
# Mental model: tokenization is translation from human text to model vocabulary.
# We do it once upfront so training doesn't repeat this work every epoch.

raw = load_dataset("json", data_files=DATA_FILE, split="train")
splits = raw.train_test_split(test_size=0.1, seed=42)

def tokenize(batch):
    # The prefix "schedule: " is a prompt that tells the model what task to do.
    # flan-t5 was trained with task prefixes, so this aligns with its pretraining.
    inputs = ["schedule: " + t for t in batch["input"]]
    
    model_inputs = tokenizer(
        inputs,
        max_length=MAX_INPUT,
        truncation=True,         # cut off if too long
        padding="max_length",    # pad if too short (batch processing needs same length)
    )
    
    # Labels are the target outputs. The trainer computes loss against these.
    labels = tokenizer(
        batch["output"],
        max_length=MAX_OUTPUT,
        truncation=True,
        padding="max_length",
    )
    
    # Replace padding token IDs with -100.
    # Why: the loss function ignores -100. We don't want the model penalised
    # for not predicting padding tokens.
    label_ids = labels["input_ids"]
    label_ids = [
        [(l if l != tokenizer.pad_token_id else -100) for l in label]
        for label in label_ids
    ]
    model_inputs["labels"] = label_ids
    return model_inputs

tokenized = splits.map(tokenize, batched=True, remove_columns=["input", "output"])

# ── Metrics ───────────────────────────────────────────────────────────────────
# For structured output tasks like cron generation, we use exact match accuracy.
# The model either produces the right expression or it doesn't.

def compute_metrics(eval_pred):
    predictions, labels = eval_pred
    
    # Decode predictions from token IDs back to text
    decoded_preds = tokenizer.batch_decode(predictions, skip_special_tokens=True)
    
    # Replace -100 in labels (we used -100 for padding above)
    labels = np.where(labels != -100, labels, tokenizer.pad_token_id)
    decoded_labels = tokenizer.batch_decode(labels, skip_special_tokens=True)
    
    # Strip whitespace
    decoded_preds  = [p.strip() for p in decoded_preds]
    decoded_labels = [l.strip() for l in decoded_labels]
    
    # Exact match: prediction must be character-for-character correct
    exact_matches = sum(p == l for p, l in zip(decoded_preds, decoded_labels))
    exact_match_acc = exact_matches / len(decoded_preds)
    
    return {
        "exact_match": round(exact_match_acc, 4),
    }

# ── Training arguments ────────────────────────────────────────────────────────
# Every argument is a decision. Here is the reasoning behind each:

args = Seq2SeqTrainingArguments(
    output_dir=OUTPUT_DIR,
    
    # Training
    num_train_epochs=EPOCHS,
    per_device_train_batch_size=BATCH_SIZE,
    per_device_eval_batch_size=BATCH_SIZE * 2,   # eval can be larger, no gradients
    learning_rate=LR,
    warmup_steps=WARMUP,
    weight_decay=0.01,      # L2 regularisation — gentle penalty for large weights
    
    # Evaluation
    eval_strategy="epoch",               # evaluate after every epoch
    save_strategy="epoch",
    load_best_model_at_end=True,         # restore best checkpoint at the end
    metric_for_best_model="exact_match", # what "best" means
    greater_is_better=True,
    
    # Generation (needed for seq2seq evaluation)
    predict_with_generate=True,
    generation_max_length=MAX_OUTPUT,
    
    # Efficiency
    fp16=torch.cuda.is_available(),      # half-precision on GPU: 2x faster, same result
    dataloader_num_workers=2,
    
    # Logging
    logging_steps=50,
    report_to="none",    # set to "wandb" if you use Weights & Biases
)

# ── Data collator ─────────────────────────────────────────────────────────────
# Assembles individual examples into batches. Handles dynamic padding.
collator = DataCollatorForSeq2Seq(tokenizer, model=model, padding=True)

# ── Trainer ───────────────────────────────────────────────────────────────────
trainer = Seq2SeqTrainer(
    model=model,
    args=args,
    train_dataset=tokenized["train"],
    eval_dataset=tokenized["test"],
    tokenizer=tokenizer,
    data_collator=collator,
    compute_metrics=compute_metrics,
    callbacks=[
        # Stop training if validation metric doesn't improve for 3 epochs
        EarlyStoppingCallback(early_stopping_patience=3)
    ],
)

# ── Train ─────────────────────────────────────────────────────────────────────
print("Starting training...")
trainer.train()

# ── Evaluate on held-out test set ─────────────────────────────────────────────
# Do this exactly once. This is your real-world accuracy number.
test_results = trainer.evaluate(tokenized["test"])
print(f"\nFinal test exact_match: {test_results['eval_exact_match']:.1%}")

# ── Save ──────────────────────────────────────────────────────────────────────
trainer.save_model(f"{OUTPUT_DIR}/final")
tokenizer.save_pretrained(f"{OUTPUT_DIR}/final")
print(f"\nModel saved to {OUTPUT_DIR}/final")
```

**Expected output for a cron task with 50k examples:**
```
Epoch 1/10: exact_match = 0.71
Epoch 2/10: exact_match = 0.87
Epoch 3/10: exact_match = 0.94
Epoch 4/10: exact_match = 0.97
Epoch 5/10: exact_match = 0.98
Epoch 6/10: exact_match = 0.98   ← patience counter: 1
Epoch 7/10: exact_match = 0.98   ← patience counter: 2
Epoch 8/10: exact_match = 0.99   ← patience counter reset
Epoch 9/10: exact_match = 0.99   ← patience counter: 1
Epoch 10/10: exact_match = 0.99  ← patience counter: 2
Early stopping triggered.

Final test exact_match: 98.7%
Model saved to checkpoints/my-specialist/final
```

---

## 3.4 LoRA: Fine-Tuning Without Touching Most of the Weights

Full fine-tuning updates every parameter in the model. For a 77M-parameter model this is fine. For a 3.8B-parameter model (phi-3-mini) on a consumer laptop, it is not — you do not have enough RAM.

**LoRA** (Low-Rank Adaptation) solves this by only updating a tiny set of adapter weights, leaving the original weights frozen:

```
FULL FINE-TUNING:
  Original weights W (77M params) → Updated weights W' (77M params)
  All 77M numbers change. Requires ~1.2GB GPU RAM for flan-t5-small.

LORA FINE-TUNING:
  Original weights W (77M params) → Frozen. Not touched.
  New adapter weights A + B (1-4M params) → These update.
  
  Effective output = W·x + A·B·x
                     ─────────   ────────
                     original    learned adaptation
                      (frozen)   (small, trainable)
  
  Requires ~200MB GPU RAM. Runs on a laptop.
```

Here is how to use LoRA with the `peft` library:

```python
# finetune_lora.py
# Mental model: we freeze the model's existing knowledge and add a small
# "notes pad" (the LoRA adapters) where new task-specific knowledge lives.

from peft import LoraConfig, get_peft_model, TaskType

# First, load your model normally
model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-small")

# Configure LoRA
lora_config = LoraConfig(
    task_type=TaskType.SEQ_2_SEQ_LM,
    
    # r: rank of the adaptation matrices. Higher = more capacity = more params.
    # 8-16 is typical. Start with 8.
    r=8,
    
    # lora_alpha: scaling factor. Rule of thumb: set to r or 2*r.
    lora_alpha=16,
    
    # Which layers to adapt. These are the attention projection layers.
    # For T5, these are the right ones to target.
    target_modules=["q", "v"],
    
    # Dropout on the adapter: small regularisation to prevent overfitting
    lora_dropout=0.05,
    
    # Don't adapt the bias terms
    bias="none",
)

# Wrap the model with LoRA adapters
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# Output: trainable params: 884,736 || all params: 77,912,064 || 1.14%
# We are updating only 1.14% of the weights!

# From here, training is identical to full fine-tuning.
# Use the same Trainer setup from section 3.3.
```

**When to use LoRA vs full fine-tuning:**

```
┌─────────────────────────────────────────────────────────┐
│          FULL FT vs LORA DECISION GUIDE                  │
│                                                         │
│  Model size < 500M params?        → Full fine-tuning    │
│  Model size 500M - 7B params?     → LoRA                │
│  Model size > 7B params?          → LoRA (mandatory)    │
│                                                         │
│  Limited GPU RAM (< 8GB)?         → LoRA                │
│  Want to merge adapters later?    → LoRA                │
│  Need maximum accuracy?           → Full fine-tuning    │
│  Training data < 5k examples?     → LoRA (less overfit) │
└─────────────────────────────────────────────────────────┘
```

---

## 3.5 Reading the Loss Curve

During training, watch these three numbers:

```
Epoch 3 | train_loss: 0.043 | eval_loss: 0.061 | exact_match: 0.942

         ▲               ▲                ▲               ▲
         │               │                │               │
      Current        How wrong         How wrong       Accuracy on
      position       on training       on validation   validation set
                       data              data
```

**Healthy training:**
- `train_loss` decreases every epoch
- `eval_loss` decreases (or stays flat) every epoch
- `exact_match` increases every epoch

**Overfitting:**
- `train_loss` keeps decreasing
- `eval_loss` starts increasing
- `exact_match` plateaus or drops
- → Reduce EPOCHS, increase weight_decay, add data

**Underfitting:**
- Both losses plateau early at a high value
- `exact_match` is low (< 80%)
- → Increase EPOCHS, increase LR, use larger base model

**Learning rate too high:**
- Loss oscillates wildly instead of trending down
- → Reduce LR by 10x and restart

---

## 3.6 Classification: A Different Task, Same Approach

For classification (intent detection, sentiment, spam filtering), the model architecture changes slightly but the training approach is identical:

```python
# finetune_classifier.py
# Mental model: instead of generating a sequence, the model maps
# an input to one of N fixed categories. Simpler output, same training loop.

from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    Trainer,
    TrainingArguments,
)
import numpy as np
import evaluate

LABELS = ["cancel_subscription", "request_refund", "technical_support"]
label2id = {l: i for i, l in enumerate(LABELS)}
id2label = {i: l for i, l in enumerate(LABELS)}

tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
model     = AutoModelForSequenceClassification.from_pretrained(
    "distilbert-base-uncased",
    num_labels=len(LABELS),
    id2label=id2label,
    label2id=label2id,
)

def tokenize(batch):
    enc = tokenizer(batch["text"], truncation=True, padding="max_length", max_length=64)
    enc["labels"] = [label2id[l] for l in batch["label"]]
    return enc

accuracy = evaluate.load("accuracy")

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)
    return accuracy.compute(predictions=predictions, references=labels)

# Training arguments for classification
args = TrainingArguments(
    output_dir="checkpoints/intent-classifier",
    num_train_epochs=5,
    per_device_train_batch_size=64,  # classification is cheaper, larger batches
    learning_rate=2e-5,              # lower LR for BERT-style models
    eval_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="accuracy",
)

# ... same Trainer setup, same training call
```

---

*In the next chapter, we take our trained specialist and compress it until it is small enough to live in a browser.*
-e 

---


# Chapter 4 — Quantization: Compressing Intelligence

## 4.1 The Mental Model: Precision vs. Size

When a model is trained, each weight is stored as a 32-bit floating-point number (float32). That gives enormous precision but costs enormous space.

```
FLOAT32 REPRESENTATION OF A SINGLE WEIGHT:
┌────────────────────────────────────────────┐
│ 1 sign │ 8 exponent bits │ 23 mantissa bits│  = 4 bytes per weight
│   bit  │                 │                 │
└────────────────────────────────────────────┘

A 77M-parameter model in float32:
77,000,000 × 4 bytes = 308 MB

The same model in int8 (8-bit integer):
77,000,000 × 1 byte  =  77 MB   (4× smaller)

The same model in int4 (4-bit integer):
77,000,000 × 0.5 bytes =  38 MB   (8× smaller)
```

Quantization is the process of mapping float32 weights to a smaller numeric format. The key insight is that most weights cluster around a relatively small range of values — we do not need 32 bits of precision to distinguish them meaningfully.

```
BEFORE QUANTIZATION (float32):
  weights: [0.1823, -0.2941, 0.0341, 0.7823, ...]
  Each stored with ~7 significant decimal digits of precision

AFTER INT8 QUANTIZATION:
  weights: [23, -38, 4, 100, ...]   (integers 0-255)
  Scale factor × offset maps integers back to approximate floats
  Precision: ~2 significant decimal digits
  
  At inference: multiply by scale to get approximate float
  0.1823 ≈ 23 × 0.00792 = 0.1822   ← 99.9% accurate
```

The accuracy loss from quantization on well-trained models is typically 0.1–2%. For specialist models with high task accuracy, the practical difference is negligible.

---

## 4.2 The Quantization Spectrum

```
┌────────────────────────────────────────────────────────────────────┐
│                    QUANTIZATION METHODS                             │
├──────────────┬────────────────┬────────────────┬───────────────────┤
│  Format      │  Size/param    │  Accuracy loss  │  Best for         │
├──────────────┼────────────────┼────────────────┼───────────────────┤
│  float32     │  4 bytes       │  0% (baseline)  │  Training         │
│  float16     │  2 bytes       │  ~0%            │  GPU inference    │
│  bfloat16    │  2 bytes       │  ~0%            │  Modern GPU inf.  │
│  int8        │  1 byte        │  0.1–1%         │  CPU / browser    │
│  int4        │  0.5 bytes     │  0.5–3%         │  Mobile / edge    │
│  int2        │  0.25 bytes    │  3–10%+         │  Experimental     │
└──────────────┴────────────────┴────────────────┴───────────────────┘

For browser deployment: int8 is the sweet spot.
For mobile with very tight memory: int4 is acceptable.
```

---

## 4.3 Post-Training Quantization (PTQ)

The fastest path: take your fine-tuned model and quantize it without any retraining.

```python
# quantize.py
# Mental model: we take the float32 weights and compute the best
# integer approximation of each one. No retraining required.

from optimum.exporters.onnx import main_export
from optimum.onnxruntime import ORTModelForSeq2SeqLM
from optimum.onnxruntime.configuration import AutoQuantizationConfig
from optimum.onnxruntime import ORTQuantizer
from pathlib import Path

MODEL_PATH  = "checkpoints/my-specialist/final"
EXPORT_PATH = "exports/my-specialist-onnx"
QUANT_PATH  = "exports/my-specialist-quantized"

# ── Step 1: Export to ONNX ────────────────────────────────────────────────────
# ONNX is a universal format that any runtime (including the browser) can run.
# This step converts PyTorch operations to the ONNX graph format.

print("Exporting to ONNX...")
main_export(
    model_name_or_path=MODEL_PATH,
    output=EXPORT_PATH,
    task="text2text-generation",        # matches our seq2seq model
    device="cpu",
    opset=13,                            # ONNX opset version — 13 is well-supported
)
# Produces:
#   encoder_model.onnx
#   decoder_model.onnx
#   decoder_with_past_model.onnx  ← handles key-value cache for faster decoding
#   tokenizer.json, config.json, etc.

print(f"ONNX export size: {sum(f.stat().st_size for f in Path(EXPORT_PATH).glob('*.onnx')) / 1e6:.1f} MB")

# ── Step 2: Quantize to int8 ──────────────────────────────────────────────────
# This maps float32 → int8 with minimal accuracy loss.
# "dynamic" means we compute quantization parameters per-inference
# rather than pre-computing them on a calibration set. Simpler, nearly as good.

print("Quantizing to int8...")
quantizers = []
for model_file in ["encoder_model.onnx", "decoder_model.onnx", "decoder_with_past_model.onnx"]:
    model = ORTModelForSeq2SeqLM.from_pretrained(EXPORT_PATH)
    quantizer = ORTQuantizer.from_pretrained(EXPORT_PATH, file_name=model_file)
    
    qconfig = AutoQuantizationConfig.arm64(    # use avx512 for x86, arm64 for Apple Silicon
        is_static=False,                        # dynamic quantization
        per_channel=False,                      # simpler, still effective
    )
    
    quantizer.quantize(
        save_dir=QUANT_PATH,
        quantization_config=qconfig,
    )

print(f"Quantized size: {sum(f.stat().st_size for f in Path(QUANT_PATH).glob('*.onnx')) / 1e6:.1f} MB")
# Before: ~308 MB (float32)
# After:   ~77 MB (int8)  — 4× smaller
```

---

## 4.4 Quantization-Aware Training (QAT)

Sometimes PTQ causes too much accuracy loss — typically for very small models or tasks requiring high numerical precision. The solution is **Quantization-Aware Training (QAT)**: simulate the quantization during fine-tuning so the model learns to be robust to the precision reduction.

```
STANDARD FINE-TUNING:
  forward pass → float32 computation → loss → update weights

QAT FINE-TUNING:
  forward pass → fake quantize weights → float32 computation
                 (simulate int8 noise)
              → loss → update weights

Result: the model is trained to perform well even with quantization noise.
Accuracy after quantization: typically 0.1–0.5% better than PTQ.
```

```python
# qat_finetune.py
# Mental model: add "fake quantization" layers into the model before training.
# The model sees noisy weights during training and learns to compensate.

import torch
from torch.quantization import prepare_qat, convert

# After loading your model:
model.train()
model.qconfig = torch.quantization.get_default_qat_qconfig('qnnpack')

# Insert fake-quantize nodes
model_prepared = prepare_qat(model)

# Train normally with model_prepared instead of model
# ... (same trainer setup as chapter 3)

# After training, convert to true int8
model_int8 = convert(model_prepared.eval())

# Now export this to ONNX
```

**When to use QAT vs PTQ:**

```
PTQ is fine when:
  ✓ Accuracy drop after PTQ is < 1% on your metric
  ✓ You want results quickly
  ✓ Your model has 100M+ parameters (more weights = more robust to quantization)

Use QAT when:
  ✗ PTQ accuracy drop is > 1%
  ✗ Your model is very small (< 50M params)
  ✗ Your task requires numerical precision (e.g., exact string matching)
  ✗ You have compute budget to retrain
```

---

## 4.5 Verifying Quantization Quality

Always benchmark before and after quantization. Never assume:

```python
# benchmark_quantization.py
# Mental model: treat quantization like a code change — test it.

from transformers import AutoTokenizer, pipeline
from optimum.onnxruntime import ORTModelForSeq2SeqLM
import time

tokenizer = AutoTokenizer.from_pretrained("checkpoints/my-specialist/final")
test_cases = [
    ("every weekday at 9am",          "0 9 * * 1-5"),
    ("every 15 minutes",              "*/15 * * * *"),
    ("first day of the month",        "0 0 1 * *"),
    ("every Sunday at 6pm",           "0 18 * * 0"),
    ("every hour on weekdays",        "0 * * * 1-5"),
]

def evaluate_model(model_path, label):
    model = ORTModelForSeq2SeqLM.from_pretrained(model_path)
    pipe  = pipeline("text2text-generation", model=model, tokenizer=tokenizer)
    
    correct = 0
    latencies = []
    
    for input_text, expected in test_cases:
        start = time.perf_counter()
        output = pipe("schedule: " + input_text, max_new_tokens=20)[0]["generated_text"].strip()
        latencies.append((time.perf_counter() - start) * 1000)
        if output == expected:
            correct += 1
        else:
            print(f"  ✗ '{input_text}' → got '{output}', expected '{expected}'")
    
    print(f"\n{label}:")
    print(f"  Accuracy:     {correct}/{len(test_cases)} ({correct/len(test_cases):.0%})")
    print(f"  Avg latency:  {sum(latencies)/len(latencies):.0f}ms")
    print(f"  P95 latency:  {sorted(latencies)[int(len(latencies)*0.95)]:.0f}ms")

evaluate_model("exports/my-specialist-onnx",        "Float32 ONNX")
evaluate_model("exports/my-specialist-quantized",   "Int8 Quantized")

# Expected output:
# Float32 ONNX:
#   Accuracy:     5/5 (100%)
#   Avg latency:  142ms
#
# Int8 Quantized:
#   Accuracy:     5/5 (100%)
#   Avg latency:  38ms      ← 3.7× faster!
```

The quantized model is not just smaller — it is often **faster**, because integer arithmetic is cheaper than floating-point arithmetic on most CPUs.

---

## 4.6 Size Optimisation Checklist

Before declaring your model ready for deployment, run through this:

```
┌──────────────────────────────────────────────────────────────────┐
│                 PRE-DEPLOYMENT SIZE CHECKLIST                     │
│                                                                  │
│  □ Exported to ONNX (not PyTorch .bin format)                   │
│    Why: ONNX is browser-compatible, .bin is not                  │
│                                                                  │
│  □ Applied int8 dynamic quantization                             │
│    Why: 4× size reduction with < 1% accuracy loss               │
│                                                                  │
│  □ Merged LoRA adapters into base model (if using LoRA)         │
│    Why: merged model has no runtime overhead                     │
│                                                                  │
│  □ Removed unused model components                               │
│    Why: some models include components unused for your task      │
│    How: check if you need all of encoder, decoder, LM head       │
│                                                                  │
│  □ Verified accuracy within 1% of float32 baseline              │
│    Why: quantization should not noticeably hurt performance      │
│                                                                  │
│  □ Benchmarked inference latency on target hardware              │
│    Why: latency on your dev machine ≠ latency on user's phone    │
│                                                                  │
│  □ Total file size < 100MB for browser, < 50MB for mobile       │
│    Why: download size directly affects user experience           │
└──────────────────────────────────────────────────────────────────┘
```

---

*In the next chapter, we take our compressed model to its permanent home: the browser.*
-e 

---


# Chapter 5 — Browser Inference: The Model Moves In

## 5.1 The Mental Model: The Browser as a Runtime

Modern browsers are remarkable execution environments. They ship with:

- **WebAssembly (WASM)**: a near-native bytecode format that runs C++, Rust, and Go code at ~80% of native speed in a sandboxed environment
- **WebGPU**: a modern graphics API that gives JavaScript access to GPU compute
- **Cache API / IndexedDB**: persistent storage that survives page reloads
- **Web Workers**: true parallelism that keeps the main thread unblocked

Together, these make the browser a surprisingly capable inference platform. The model files live in Cache Storage. The inference runs in a Web Worker via WASM (or WebGPU if available). The main thread — your React component — never blocks.

```
┌───────────────────────────────────────────────────────────────────┐
│                      BROWSER AI ARCHITECTURE                       │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                        MAIN THREAD                          │  │
│  │  React/Vue/Svelte UI  ←──── results ←──── postMessage()   │  │
│  │                       ────── input ──────▶ postMessage()   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              │▲                                   │
│                    Web Worker│ (separate thread)                  │
│  ┌───────────────────────────▼─────────────────────────────────┐  │
│  │                     WEB WORKER                              │  │
│  │                                                             │  │
│  │   Transformers.js pipeline                                  │  │
│  │        │                                                    │  │
│  │        ▼                                                    │  │
│  │   ONNX Runtime Web  (WASM / WebGPU)                        │  │
│  │        │                                                    │  │
│  │        ▼                                                    │  │
│  │   Model weights  (loaded from Cache API)                    │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              │▲                                   │
│                  Cache API / IndexedDB                            │
│  ┌───────────────────────────▼─────────────────────────────────┐  │
│  │    model.onnx (downloaded once, cached forever)             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              │▲                                   │
│                   First visit only                               │
│                  (CDN or your server)                            │
└───────────────────────────────────────────────────────────────────┘
```

---

## 5.2 Transformers.js: Your Browser Inference Engine

[Transformers.js](https://huggingface.co/docs/transformers.js) is a JavaScript port of HuggingFace's transformers library. It runs ONNX models using `onnxruntime-web` and provides the same API as Python transformers.

```javascript
// The Python API:
from transformers import pipeline
pipe = pipeline("text2text-generation", model="my-model")
result = pipe("schedule: every weekday at 9am")

// The JavaScript API (Transformers.js) — nearly identical:
import { pipeline } from '@xenova/transformers';
const pipe = await pipeline('text2text-generation', 'my-model');
const result = await pipe('schedule: every weekday at 9am');
```

This symmetry is intentional and powerful. Your training code and your inference code share the same conceptual API. What you test in Python is what you deploy in JavaScript.

---

## 5.3 Hosting Your Model

You have three options for where the model files live:

```
OPTION 1: HuggingFace Hub (recommended for public models)
────────────────────────────────────────────────────────
  Upload once:  huggingface-cli upload your-org/my-specialist ./exports/quantized/
  Load in JS:   pipeline('text2text-generation', 'your-org/my-specialist')
  
  Pros:  Free CDN, automatic CORS headers, versioning
  Cons:  Public by default (private repos require auth tokens)

OPTION 2: Your own CDN / server
──────────────────────────────
  Serve files from /public/models/my-specialist/
  Load in JS:   pipeline('text2text-generation', '/models/my-specialist')
  
  Pros:  Private, full control, bundled with your app
  Cons:  You pay bandwidth, need to configure CORS

OPTION 3: Bundle in the app (for small models < 30MB)
──────────────────────────────────────────────────────
  Import directly as assets in your bundler
  
  Pros:  Truly offline-first from install, no CDN needed
  Cons:  Increases app bundle size (acceptable for < 30MB)
```

For most projects, Option 1 (HuggingFace Hub) during development and Option 2 (your CDN) for production is the right path.

---

## 5.4 The Complete Browser Inference Setup

Here is a production-ready implementation with every pattern you need:

```javascript
// model-worker.js
// Mental model: this script runs in a Web Worker — a separate thread
// with its own memory, separate from the UI. The model loads here.
// The UI sends messages; the worker responds. Never the other way around.

import { pipeline, env } from '@xenova/transformers';

// ── Environment configuration ─────────────────────────────────────────────
// These settings control how Transformers.js behaves in the browser.

env.useBrowserCache    = true;   // Cache model in CacheStorage after first download
env.allowLocalModels   = false;  // Disable local filesystem (not available in browsers)

// Use all available CPU threads for WASM computation
// navigator.hardwareConcurrency = number of logical CPU cores
env.backends.onnx.wasm.numThreads = navigator.hardwareConcurrency ?? 4;

// ── State ─────────────────────────────────────────────────────────────────
let pipe = null;
let ready = false;

// ── Model loading ─────────────────────────────────────────────────────────
async function loadModel() {
  try {
    // Signal: starting download
    self.postMessage({ type: 'status', phase: 'downloading', pct: 0 });

    pipe = await pipeline(
      'text2text-generation',
      'your-org/my-specialist',   // ← your HuggingFace repo
      {
        quantized: true,          // use quantized (int8) ONNX files

        // progress_callback fires for every file being downloaded.
        // Use it to show accurate progress to the user.
        progress_callback(info) {
          if (info.status === 'downloading') {
            const pct = info.total
              ? Math.round((info.loaded / info.total) * 100)
              : 0;
            self.postMessage({
              type: 'status',
              phase: 'downloading',
              pct,
              file: info.file,
              loaded: info.loaded,
              total: info.total,
            });
          }
          if (info.status === 'loading') {
            self.postMessage({ type: 'status', phase: 'loading', pct: 95 });
          }
        },
      }
    );

    // ── Warm-up inference ──────────────────────────────────────────────────
    // Run one silent inference after loading. This causes the WASM JIT
    // compiler to compile the hot paths. Without this, the first real
    // user request takes 3-5× longer than subsequent ones.
    self.postMessage({ type: 'status', phase: 'warming', pct: 97 });
    await pipe('schedule: every day at midnight', { max_new_tokens: 10 });

    // Ready!
    ready = true;
    self.postMessage({ type: 'status', phase: 'ready', pct: 100 });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
}

// ── Message handler ───────────────────────────────────────────────────────
self.addEventListener('message', async (event) => {
  const { type, id, input } = event.data;

  if (type === 'load') {
    loadModel();
    return;
  }

  if (type === 'infer') {
    if (!ready) {
      self.postMessage({ type: 'error', id, message: 'Model not ready' });
      return;
    }
    try {
      const result = await pipe(
        'schedule: ' + input,   // prepend task prefix
        {
          max_new_tokens: 24,
          do_sample: false,     // greedy/beam decoding for deterministic output
          num_beams: 4,         // beam search: consider 4 candidates simultaneously
        }
      );
      const output = result[0]?.generated_text?.trim() ?? '';
      self.postMessage({ type: 'result', id, output });
    } catch (err) {
      self.postMessage({ type: 'error', id, message: err.message });
    }
  }
});

// Auto-start loading when the worker initialises
loadModel();
```

```javascript
// ModelClient.js
// Mental model: this is the bridge between your UI and the worker.
// It manages the worker lifecycle, converts the event-based worker API
// into a clean Promise-based API, and handles timeouts.

class ModelClient {
  constructor() {
    this.worker   = null;
    this.pending  = new Map();  // id → { resolve, reject, timer }
    this.counter  = 0;
    this.listeners = [];
    this.phase    = 'idle';
  }

  init() {
    if (this.worker) return;

    // Create worker from the worker script
    this.worker = new Worker(
      new URL('./model-worker.js', import.meta.url),
      { type: 'module' }
    );

    this.worker.addEventListener('message', (e) => this._handleMessage(e.data));
    this.worker.addEventListener('error',   (e) => {
      this._emit({ phase: 'error', message: e.message });
    });
  }

  // Subscribe to status updates (phase, progress percentage, etc.)
  onStatus(callback) {
    this.listeners.push(callback);
    return () => { this.listeners = this.listeners.filter(l => l !== callback); };
  }

  // Run inference. Returns a Promise that resolves with the output string.
  // Rejects if the model is not ready or inference takes > timeoutMs.
  infer(input, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
      const id = `req_${++this.counter}`;

      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Inference timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timer });
      this.worker.postMessage({ type: 'infer', id, input });
    });
  }

  _handleMessage(msg) {
    if (msg.type === 'status') {
      this.phase = msg.phase;
      this._emit(msg);
      return;
    }
    if (msg.type === 'result') {
      const req = this.pending.get(msg.id);
      if (!req) return;
      clearTimeout(req.timer);
      this.pending.delete(msg.id);
      req.resolve(msg.output);
      return;
    }
    if (msg.type === 'error') {
      if (msg.id) {
        const req = this.pending.get(msg.id);
        if (req) {
          clearTimeout(req.timer);
          this.pending.delete(msg.id);
          req.reject(new Error(msg.message));
        }
      }
      this._emit({ phase: 'error', message: msg.message });
    }
  }

  _emit(data) {
    this.listeners.forEach(l => l(data));
  }

  get isReady() { return this.phase === 'ready'; }
}

// Export a singleton
export const modelClient = new ModelClient();
```

```jsx
// CronInput.jsx — React component using the model
// Mental model: the component subscribes to model status and renders
// accordingly. It never knows about workers or ONNX. It just calls infer().

import { useState, useEffect, useRef } from 'react';
import { modelClient } from './ModelClient';

export function CronInput() {
  const [status, setStatus] = useState({ phase: 'idle', pct: 0 });
  const [input,  setInput]  = useState('');
  const [result, setResult] = useState(null);
  const [busy,   setBusy]   = useState(false);
  const debounce = useRef(null);

  // Boot the model once on mount
  useEffect(() => {
    modelClient.init();
    const unsub = modelClient.onStatus(setStatus);
    return unsub;
  }, []);

  // Debounced inference: wait 350ms after user stops typing
  useEffect(() => {
    clearTimeout(debounce.current);
    if (!input.trim() || !modelClient.isReady) return;

    debounce.current = setTimeout(async () => {
      setBusy(true);
      try {
        const output = await modelClient.infer(input);
        setResult(output);
      } catch (e) {
        console.error(e);
      } finally {
        setBusy(false);
      }
    }, 350);

    return () => clearTimeout(debounce.current);
  }, [input]);

  return (
    <div>
      {/* Model status badge */}
      <StatusBadge phase={status.phase} pct={status.pct} />

      {/* Input */}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={!modelClient.isReady}
        placeholder={modelClient.isReady ? 'every weekday at 9am' : 'Loading model...'}
      />

      {/* Result */}
      {busy   && <span>Translating...</span>}
      {result && !busy && <code>{result}</code>}
    </div>
  );
}
```

---

## 5.5 Caching Strategy: Offline First

The first visit requires a download. Every subsequent visit should be instant. This is achieved through the browser's Cache API, which Transformers.js uses automatically when `env.useBrowserCache = true`.

```
FIRST VISIT:
  User loads page
  → Worker initialises
  → Worker fetches model files from CDN (one request per .onnx file)
  → Files stored in CacheStorage under cache key "transformers-cache"
  → Model loads from cache into WASM memory
  → Ready
  
SUBSEQUENT VISITS (even offline):
  User loads page
  → Worker initialises
  → Worker checks CacheStorage → files found!
  → Files loaded directly from local cache
  → No network request
  → Ready (faster — no download)
```

You can observe this in DevTools → Application → Cache Storage → `transformers-cache`.

To pre-warm the cache (useful for PWAs):

```javascript
// service-worker.js
// Mental model: the service worker intercepts network requests.
// We use it to pre-fetch model files during install so they're
// ready before the user even asks for them.

const MODEL_FILES = [
  'https://huggingface.co/your-org/my-specialist/resolve/main/encoder_model_quantized.onnx',
  'https://huggingface.co/your-org/my-specialist/resolve/main/decoder_model_quantized.onnx',
  'https://huggingface.co/your-org/my-specialist/resolve/main/tokenizer.json',
  'https://huggingface.co/your-org/my-specialist/resolve/main/config.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('model-v1').then(cache => cache.addAll(MODEL_FILES))
  );
});
```

---

## 5.6 WebGPU: GPU Acceleration in the Browser

WebGPU is available in Chrome 113+ and gives access to the device's GPU from JavaScript. For models that are large enough to benefit (generally > 100M parameters), WebGPU can give 5-10× speedup over WASM.

```javascript
// model-worker-webgpu.js
import { pipeline, env } from '@xenova/transformers';

// Try WebGPU, fall back to WASM if unavailable
const supportsWebGPU = 'gpu' in navigator;

pipe = await pipeline(
  'text2text-generation',
  'your-org/my-specialist',
  {
    // 'webgpu' → uses GPU, requires float16 model
    // 'wasm'   → uses CPU, works with int8 quantized model
    device: supportsWebGPU ? 'webgpu' : 'wasm',
    dtype: supportsWebGPU ? 'float16' : 'q8',  // match dtype to device
  }
);
```

**Current reality of WebGPU for small models:**

```
┌──────────────────────────────────────────────────────────────┐
│              WEBGPU vs WASM for SMALL MODELS                  │
│                                                              │
│  Model size    WASM (int8)    WebGPU (float16)    Winner     │
│  ──────────    ───────────    ───────────────     ──────     │
│  < 100MB       60-150ms       80-120ms            WASM       │
│                                                   (overhead  │
│                                                   not worth) │
│  100MB-500MB   100-400ms      50-150ms            WebGPU     │
│  > 500MB       400ms+         100-200ms           WebGPU     │
│                                                              │
│  For the small specialists in this book (< 100MB):           │
│  WASM + int8 quantization is usually the right choice.       │
│  The GPU transfer overhead outweighs the compute gain.       │
└──────────────────────────────────────────────────────────────┘
```

---

## 5.7 Performance Profiling

Measure every step. You cannot optimise what you cannot measure.

```javascript
// profile.js
// Mental model: time each phase of model inference separately.
// The bottleneck is almost never where you expect it.

async function profileInference(pipe, input) {
  const times = {};

  // Tokenization
  let t = performance.now();
  const tokens = pipe.tokenizer(input);
  times.tokenize = performance.now() - t;

  // Encoder (for seq2seq models)
  t = performance.now();
  const encoderOutput = await pipe.model.encoder({ input_ids: tokens.input_ids });
  times.encode = performance.now() - t;

  // Decoder (autoregressive generation)
  t = performance.now();
  const result = await pipe(input, { max_new_tokens: 20 });
  times.decode = performance.now() - t - times.encode;

  // Total
  times.total = times.tokenize + times.encode + times.decode;

  console.table(times);
  return result;
}

// Example output for flan-t5-small int8:
// ┌──────────┬────────────┐
// │ Phase    │ Time (ms)  │
// ├──────────┼────────────┤
// │ tokenize │ 0.8        │  ← negligible
// │ encode   │ 12.4       │  ← encoder is fast
// │ decode   │ 28.6       │  ← decoder runs once per output token
// │ total    │ 41.8       │
// └──────────┴────────────┘
```

**Key insight:** For seq2seq models, generation latency scales with output length, not input length. A 5-token output is 5× faster than a 25-token output. Design your output format to be short.

---

*In the next chapter, we look at deploying to mobile — React Native and native apps — and the specific constraints of running models on phones.*
-e 

---


# Chapter 6 — Mobile Deployment: Models in Your Pocket

## 6.1 The Mental Model: Constrained Resources, High Expectations

Mobile devices are extraordinary computers — a modern iPhone has more computational power than a server room from 2010. But they have hard constraints that desktop browsers do not:

```
┌─────────────────────────────────────────────────────────────────┐
│              MOBILE CONSTRAINTS vs BROWSER                       │
│                                                                 │
│  Constraint        Browser (Desktop)   Mobile                  │
│  ─────────────     ─────────────────   ──────────────────      │
│  RAM available     4-16 GB             1-4 GB (shared)         │
│  Storage budget    Generous            50-100 MB max           │
│  Battery impact    Plugged in often    Every inference drains   │
│  Thermal budget    Active cooling      Throttles after 30s GPU  │
│  Connectivity      Often wired         Often cell / offline     │
│  Update frequency  Browser auto-update Manual app updates       │
│                                                                 │
│  Target model size for mobile:  < 50MB (int4 quantized)        │
│  Target inference time:         < 200ms per request            │
│  Target RAM usage:              < 300MB peak                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6.2 React Native with TensorFlow.js

For React Native apps, `@tensorflow/tfjs-react-native` provides on-device inference. For transformer models, the pipeline looks different from the browser:

```
┌─────────────────────────────────────────────────────────────────┐
│               REACT NATIVE MODEL PIPELINE                        │
│                                                                 │
│  Training output (PyTorch .bin)                                 │
│        │                                                        │
│        ▼                                                        │
│  Convert to TFLite (.tflite)  ← for Android/iOS native         │
│  or ONNX (.onnx)              ← for React Native / Expo        │
│        │                                                        │
│        ▼                                                        │
│  Bundle in app assets  or  download on first launch             │
│        │                                                        │
│        ▼                                                        │
│  onnxruntime-react-native  or  @tensorflow/tfjs-react-native    │
│        │                                                        │
│        ▼                                                        │
│  Model inference (JS thread, async)                             │
└─────────────────────────────────────────────────────────────────┘
```

```bash
# Install for React Native
npm install onnxruntime-react-native
# This wraps the native ONNX Runtime libraries for iOS and Android
```

```javascript
// CronModelRN.js — React Native version
// Mental model: ONNX Runtime React Native uses the same model files
// as the browser, but calls the native runtime instead of WASM.
// The API is similar but not identical to Transformers.js.

import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

class CronModelRN {
  constructor() {
    this.encoderSession = null;
    this.decoderSession = null;
    this.tokenizer      = null;
  }

  async load() {
    // Download model files to app's document directory on first launch.
    // On subsequent launches, serve from local cache.
    const MODEL_BASE = 'https://your-cdn.com/models/cronly-cron-t5-int8/';
    const localDir   = FileSystem.documentDirectory + 'models/cronly/';

    await FileSystem.makeDirectoryAsync(localDir, { intermediates: true });

    const files = ['encoder_model_quantized.onnx', 'decoder_model_quantized.onnx', 'tokenizer.json'];

    for (const file of files) {
      const localPath = localDir + file;
      const info = await FileSystem.getInfoAsync(localPath);
      if (!info.exists) {
        // First launch: download
        await FileSystem.downloadAsync(MODEL_BASE + file, localPath);
      }
      // Subsequent launches: already cached, skip download
    }

    // Load ONNX sessions
    this.encoderSession = await InferenceSession.create(localDir + 'encoder_model_quantized.onnx');
    this.decoderSession = await InferenceSession.create(localDir + 'decoder_model_quantized.onnx');

    // Load tokenizer config
    const tokenizerJson = await FileSystem.readAsStringAsync(localDir + 'tokenizer.json');
    this.tokenizer = JSON.parse(tokenizerJson);
  }

  async infer(input) {
    // For a real implementation, use a proper tokenizer library.
    // Here we illustrate the session.run() API pattern.
    const inputIds = this._tokenize('schedule: ' + input);
    
    const inputTensor = new Tensor('int64', inputIds, [1, inputIds.length]);
    
    const encoderOutput = await this.encoderSession.run({
      input_ids:      inputTensor,
      attention_mask: new Tensor('int64', new Array(inputIds.length).fill(1n), [1, inputIds.length]),
    });

    // Autoregressive decoding — generate one token at a time
    const outputTokens = await this._decode(encoderOutput);
    return this._detokenize(outputTokens);
  }
}
```

---

## 6.3 Native iOS / Android: CoreML and NNAPI

For maximum performance on mobile, bypass JavaScript entirely and use the device's native AI accelerator:

```
iOS:    CoreML → uses Apple Neural Engine (ANE) → fastest option
Android: NNAPI → uses Qualcomm/Samsung NPU      → fastest option
```

```python
# convert_to_coreml.py
# Mental model: CoreML is Apple's native model format.
# Converting to CoreML lets the model run on the Neural Engine
# rather than the CPU — typically 10-30× faster.

import coremltools as ct
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch

# Load your fine-tuned model
model     = AutoModelForSequenceClassification.from_pretrained("./my-specialist")
tokenizer = AutoTokenizer.from_pretrained("./my-specialist")
model.eval()

# Create a sample input (required for tracing)
sample   = tokenizer("example input", return_tensors="pt")
input_ids = sample["input_ids"]
attention_mask = sample["attention_mask"]

# Trace the model — captures the computation graph
traced = torch.jit.trace(
    model,
    (input_ids, attention_mask),
    strict=False
)

# Convert to CoreML
mlmodel = ct.convert(
    traced,
    inputs=[
        ct.TensorType(name="input_ids",      shape=input_ids.shape,      dtype=int),
        ct.TensorType(name="attention_mask",  shape=attention_mask.shape, dtype=int),
    ],
    # Use float16 for size/speed — same tradeoff as browser quantization
    compute_precision=ct.precision.FLOAT16,
    # Target the Neural Engine if available
    compute_units=ct.ComputeUnit.ALL,
)

mlmodel.save("MySpecialist.mlpackage")
# Size: ~25MB for a 66M-parameter distilbert in float16
```

---

## 6.4 Bundling vs. Downloading: The Size Decision

The most important deployment decision for mobile:

```
BUNDLE WITH APP (models < 30MB):
  ✓ Works offline from first launch — no waiting, no error state
  ✓ No download logic to write or maintain
  ✓ App Store / Play Store cache the app, so re-installs are fast
  ✗ Increases app binary size (reviewed by App Store for large apps)
  ✗ Updating the model requires an app update
  
  Best for: tiny models (whisper-tiny, distilbert-tiny, mobilenet)

DOWNLOAD ON FIRST LAUNCH (models 30MB-500MB):
  ✓ App store submission stays small
  ✓ Update model without app update
  ✗ First launch requires internet connection
  ✗ Must handle download progress, failure, resume
  ✗ Users may uninstall during download if it's slow
  
  Best for: most transformer models (flan-t5-small, etc.)
  
  Implementation requirements:
  - Background download (iOS BGURLSession, Android WorkManager)
  - Resume on failure
  - Progress UI
  - Graceful degradation when download incomplete
```

---

## 6.5 The Graceful Degradation Pattern

When the model is not yet available — first launch, download in progress, or offline without a cached model — your app must behave sensibly:

```javascript
// ModelState.js
// Mental model: model availability is a state machine, not a boolean.
// Design your UI for every state, not just the happy path.

const ModelState = {
  NOT_DOWNLOADED:   'not_downloaded',   // first launch, no model
  DOWNLOADING:      'downloading',      // download in progress
  DOWNLOAD_FAILED:  'download_failed',  // network error during download
  LOADING:          'loading',          // model downloaded, loading into memory
  READY:            'ready',            // model loaded, ready for inference
  ERROR:            'error',            // model failed to load
};

// UI rendering for each state:
function renderModelState(state, progress) {
  switch (state) {
    case ModelState.NOT_DOWNLOADED:
      return <DownloadPrompt onDownload={startDownload} />;
      
    case ModelState.DOWNLOADING:
      return <DownloadProgress pct={progress} />;
      
    case ModelState.DOWNLOAD_FAILED:
      return <DownloadError onRetry={retryDownload} />;
      
    case ModelState.LOADING:
      return <LoadingSpinner text="Preparing AI..." />;
      
    case ModelState.READY:
      return <FullFeatureUI />;   // the happy path
      
    case ModelState.ERROR:
      return <ErrorFallback message="AI unavailable. Try reinstalling." />;
  }
}
```

---

*In the next chapter, we zoom out from individual models to full AI systems — how to combine multiple small models to achieve capabilities that no single small model could deliver alone.*
-e 

---


# Chapter 7 — AI Systems: Combining Small Models Into Large Intelligence

## 7.1 The Mental Model: The Compound Machine

A single small model is a specialist tool. An AI system is a compound machine — multiple tools, each doing what it does best, connected by an orchestration layer.

The key insight: **a pipeline of three 30MB models can outperform a single 500MB model on a complex task, while using less memory, running faster, and being easier to update.**

```
┌──────────────────────────────────────────────────────────────────┐
│                    THE COMPOUND AI SYSTEM                         │
│                                                                  │
│  User input: "Cancel my account, I'm very unhappy with billing"  │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  MODEL 1: Intent Classifier (distilbert, 25MB)          │    │
│  │  Output: { intent: "cancel", sentiment: "negative" }    │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                             │                                    │
│               ┌─────────────┴──────────────┐                    │
│               ▼                            ▼                    │
│  ┌────────────────────┐    ┌─────────────────────────────────┐  │
│  │  MODEL 2:          │    │  MODEL 3: Sentiment Analysis     │  │
│  │  Entity Extractor  │    │  (distilbert-sst2, 25MB)        │  │
│  │  (bert-ner, 25MB)  │    │  Output: { urgency: "high" }    │  │
│  │  Output: account # │    └──────────────┬──────────────────┘  │
│  └──────────┬─────────┘                   │                     │
│             │                             │                     │
│             └──────────────┬──────────────┘                     │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ORCHESTRATOR (your code, not a model)                  │    │
│  │  Route: high-urgency cancel → human agent               │    │
│  │  Route: normal cancel → automated flow                   │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                             │                                    │
│                             ▼                                    │
│                      Appropriate action                          │
└──────────────────────────────────────────────────────────────────┘
```

Total model memory: 75MB. Total models: 3. Each model is fast independently. The system is fast in aggregate.

---

## 7.2 Retrieval-Augmented Generation (RAG) at the Edge

RAG is the pattern of giving a language model access to external knowledge at inference time, rather than baking all knowledge into the model weights.

For offline edge deployment, this means the "external knowledge" lives locally — in a vector database stored on the device.

```
┌──────────────────────────────────────────────────────────────────┐
│                    OFFLINE RAG ARCHITECTURE                       │
│                                                                  │
│  KNOWLEDGE BASE (one-time setup)                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Your documents → Embedding model → Vectors              │   │
│  │  (product docs, FAQ, manual)   (MiniLM, 22MB)  (stored)  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                     Vector index file                            │
│                    (e.g., .faiss, ~10MB)                        │
│                              │                                   │
│  QUERY TIME                  │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  User question                                           │   │
│  │       │                                                  │   │
│  │       ▼                                                  │   │
│  │  Embedding model → query vector                         │   │
│  │       │                                                  │   │
│  │       ▼                                                  │   │
│  │  Vector search → top 3 relevant document chunks         │   │
│  │       │                                                  │   │
│  │       ▼                                                  │   │
│  │  Prompt = question + chunks                              │   │
│  │       │                                                  │   │
│  │       ▼                                                  │   │
│  │  Generation model → answer                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

```python
# build_vector_index.py
# Mental model: we precompute embeddings for all our documents so
# that at query time, we only need to compute the query embedding
# and do a fast vector search.

from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import json

# all-MiniLM-L6-v2: 22MB, produces 384-dimensional embeddings.
# Fast, accurate, well-suited for semantic search.
embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# Your documents — could be a product manual, FAQ, knowledge base
documents = [
    "To cancel your subscription, go to Settings > Billing > Cancel Plan.",
    "Refunds are processed within 5-7 business days.",
    "Our support team is available Monday through Friday, 9am to 5pm EST.",
    # ... thousands more
]

# Embed all documents (one-time cost, done offline/at build time)
embeddings = embedder.encode(documents, show_progress_bar=True)
# Shape: (n_docs, 384)

# Build FAISS index for fast nearest-neighbour search
index = faiss.IndexFlatIP(384)              # Inner product = cosine similarity on normalised vectors
faiss.normalize_L2(embeddings)              # Normalise for cosine similarity
index.add(embeddings.astype(np.float32))

# Save for distribution with the app
faiss.write_index(index, "knowledge.faiss")
json.dump(documents, open("documents.json", "w"))
print(f"Index: {os.path.getsize('knowledge.faiss') / 1e6:.1f} MB")
```

```javascript
// rag-engine.js (browser)
// Mental model: at query time, we embed the question and find
// the most similar documents. We then use those documents as
// context for the generation model.

import { pipeline } from '@xenova/transformers';

// Load both models
const embedder  = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
const generator = await pipeline('text2text-generation', 'your-org/my-specialist');

// Load the pre-built index
const documents  = await fetch('/knowledge/documents.json').then(r => r.json());
// Note: FAISS doesn't run natively in the browser.
// Use a JavaScript vector search library instead:
// Options: usearch, @pinecone-database/pinecone (edge), or a simple cosine sim

function cosineSimilarity(a, b) {
  const dot   = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (normA * normB);
}

async function retrieveAndGenerate(question) {
  // Step 1: Embed the question
  const output = await embedder(question, { pooling: 'mean', normalize: true });
  const queryEmbedding = Array.from(output.data);

  // Step 2: Load document embeddings (pre-computed, stored as JSON array)
  const docEmbeddings = await fetch('/knowledge/embeddings.json').then(r => r.json());

  // Step 3: Find top-3 most similar documents
  const scores = docEmbeddings.map((emb, i) => ({
    index: i,
    score: cosineSimilarity(queryEmbedding, emb),
  }));
  scores.sort((a, b) => b.score - a.score);
  const topDocs = scores.slice(0, 3).map(s => documents[s.index]);

  // Step 4: Generate answer with context
  const context = topDocs.join('\n\n');
  const prompt  = `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer:`;
  
  const result = await generator(prompt, { max_new_tokens: 100 });
  return result[0].generated_text;
}
```

---

## 7.3 Model Cascades: Fast Path, Slow Path

Not every input needs your most capable model. A cascade routes simple inputs to a fast, tiny model and only escalates to a heavier model when needed.

```
┌──────────────────────────────────────────────────────────────────┐
│                      MODEL CASCADE                                │
│                                                                  │
│  Input                                                           │
│    │                                                             │
│    ▼                                                             │
│  ┌────────────────────────────────┐                             │
│  │  GATE MODEL  (tiny, 2MB)       │                             │
│  │  Classifies: simple / complex  │                             │
│  └──────────────┬─────────────────┘                             │
│                 │                                                │
│        ┌────────┴────────┐                                       │
│        ▼                 ▼                                       │
│  ┌─────────────┐  ┌─────────────────────────────────────┐       │
│  │ FAST MODEL  │  │  HEAVY MODEL                        │       │
│  │ (30MB)      │  │  (100MB)                            │       │
│  │ 95% of      │  │  5% of inputs — complex edge cases  │       │
│  │ inputs      │  │                                     │       │
│  └──────┬──────┘  └─────────────────┬───────────────────┘       │
│         │                           │                           │
│         └──────────────┬────────────┘                           │
│                        ▼                                        │
│                     Output                                       │
└──────────────────────────────────────────────────────────────────┘

Latency: 95% of inputs → 40ms (fast path)
         5% of inputs  → 200ms (heavy path)
Average: 49ms — much better than always using the 200ms model
```

```javascript
// cascade.js
// Mental model: the gate model is cheap to run. Use it to decide
// whether to invest in the expensive model. This is how you achieve
// both speed and quality without compromise.

class ModelCascade {
  constructor(gateModel, fastModel, heavyModel) {
    this.gate  = gateModel;
    this.fast  = fastModel;
    this.heavy = heavyModel;
  }

  async infer(input) {
    // Gate: classify as simple (confidence > 0.9) or complex
    const gateResult = await this.gate.infer(input);
    const isSimple   = gateResult.confidence > 0.9;

    if (isSimple) {
      return { model: 'fast', result: await this.fast.infer(input) };
    } else {
      return { model: 'heavy', result: await this.heavy.infer(input) };
    }
  }
}
```

---

## 7.4 Specialisation vs. Generalisation Trade-off

```
┌──────────────────────────────────────────────────────────────────┐
│          THE SPECIALISATION CONTINUUM                             │
│                                                                  │
│  GENERALIST                              SPECIALIST              │
│  ◄──────────────────────────────────────────────────────►       │
│                                                                  │
│  GPT-4                Flan-T5-small            Fine-tuned       │
│  (API only)           (77M params,             Flan-T5-small    │
│                        general)                (77M params,     │
│                                                cron expert)     │
│                                                                  │
│  Handles everything   Handles most things      Handles one      │
│  perfectly            adequately               thing perfectly  │
│                                                                  │
│  Works offline? No    Works offline? Yes        Works offline?  │
│                                                                  │
│  Cost: $$$$           Cost: Free                Yes. Cost: Free  │
└──────────────────────────────────────────────────────────────────┘
```

The design question for every AI system you build: **what is the minimal set of tasks, each handled by a specialist, that covers the user's needs?**

Resist the temptation to use one large generalist model for everything. A system of three specialists is typically faster, cheaper, more accurate, and easier to maintain.

---

*In the next chapter, we examine MemPalace — a retrieval-augmented memory system — and answer the question of whether it can run in the browser.*
-e 

---


# Chapter 8 — MemPalace in the Browser: A Detailed Analysis

## 8.1 What MemPalace Is

[MemPalace](https://github.com/MemPalace/mempalace) is a retrieval-augmented memory system designed to give AI assistants persistent, associative memory. The core idea: rather than stuffing everything into a model's context window, MemPalace stores memories as embeddings in a vector database and retrieves relevant ones at query time.

The system has three layers:

```
┌──────────────────────────────────────────────────────────────────┐
│                     MEMPALACE ARCHITECTURE                        │
│                                                                  │
│  WRITE PATH (storing a memory):                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Text → Embedding model → Vector → Vector store            │  │
│  │  "User likes dark mode"  (MiniLM)   [0.23, -0.41, ...]    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  READ PATH (retrieving relevant memories):                        │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Query → Embed → Search → Top-k memories → Context         │  │
│  │  "What does the user prefer?" → similar vectors → recall   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  CONSOLIDATION (background, periodic):                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Cluster similar memories → summarise → reduce storage      │  │
│  │  (this is the "palace" metaphor — organising the palace)    │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 8.2 The Browser Compatibility Analysis

To answer "can MemPalace run in the browser?", we need to examine each dependency:

```
MEMPALACE DEPENDENCIES:
─────────────────────────────────────────────────────────────────
Dependency              Browser Compatible?  Notes
─────────────────────   ──────────────────   ────────────────────
Embedding model         ✅ YES               Run via Transformers.js
  (MiniLM, 22MB)                             (WASM or WebGPU)

Vector similarity       ✅ YES               Pure JS cosine sim,
  search                                     or usearch WASM port

IndexedDB / OPFS        ✅ YES               Browser native storage
  (vector persistence)                       OPFS = Origin Private
                                             File System (fast)

Consolidation LLM       ⚠️ PARTIAL           Small model (T5) works.
  (summarisation)                            Large model (GPT) needs API.

Python runtime          ❌ NO               MemPalace server uses
  (current server)                           Python. Cannot run as-is.

FastAPI server          ❌ NO               Server component.
                                             Replace with browser APIs.
─────────────────────────────────────────────────────────────────
```

**The verdict: MemPalace as a server cannot run in the browser. But its concepts and algorithms can be reimplemented entirely in the browser.**

---

## 8.3 Browser-Native MemPalace: The Implementation Path

Here is how to build a MemPalace-equivalent that runs entirely in the browser:

```javascript
// BrowserMemPalace.js
// Mental model: three components — embedding, storage, retrieval.
// All run in the browser. All persist across sessions via OPFS.

import { pipeline } from '@xenova/transformers';

class BrowserMemPalace {
  constructor() {
    this.embedder  = null;     // Transformers.js embedding pipeline
    this.memories  = [];       // { id, text, embedding, timestamp, importance }
    this.db        = null;     // OPFS file handle for persistence
  }

  // ── Initialisation ─────────────────────────────────────────────────────────
  async init() {
    // Load the embedding model (22MB, cached after first download)
    this.embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      { quantized: true }
    );

    // Load persisted memories from OPFS (Origin Private File System)
    // OPFS is a browser API for fast, persistent, private file storage.
    // Unlike IndexedDB, OPFS supports synchronous access in Web Workers.
    await this._loadFromStorage();
  }

  // ── Remember: store a new memory ──────────────────────────────────────────
  async remember(text, importance = 1.0) {
    // Embed the text
    const output    = await this.embedder(text, { pooling: 'mean', normalize: true });
    const embedding = Array.from(output.data);

    const memory = {
      id:         crypto.randomUUID(),
      text,
      embedding,
      timestamp:  Date.now(),
      importance,
      accessCount: 0,
    };

    this.memories.push(memory);
    await this._saveToStorage();
    return memory.id;
  }

  // ── Recall: retrieve relevant memories ─────────────────────────────────────
  async recall(query, topK = 5, threshold = 0.5) {
    // Embed the query
    const output        = await this.embedder(query, { pooling: 'mean', normalize: true });
    const queryEmbedding = Array.from(output.data);

    // Score all memories
    const scored = this.memories.map(memory => ({
      ...memory,
      score: this._cosineSimilarity(queryEmbedding, memory.embedding),
    }));

    // Sort by score, filter by threshold, take top-k
    const relevant = scored
      .filter(m => m.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    // Update access counts (boosts future retrieval of frequently-accessed memories)
    for (const m of relevant) {
      const idx = this.memories.findIndex(mem => mem.id === m.id);
      if (idx >= 0) this.memories[idx].accessCount++;
    }

    return relevant;
  }

  // ── Forget: remove a memory ────────────────────────────────────────────────
  async forget(id) {
    this.memories = this.memories.filter(m => m.id !== id);
    await this._saveToStorage();
  }

  // ── Consolidate: merge similar memories ───────────────────────────────────
  // Mental model: memories that are very similar to each other (score > 0.92)
  // are candidates for merging. This prevents unbounded storage growth.
  // In a full implementation, we'd use a small generative model to write
  // a merged summary. Here we illustrate the clustering logic.
  async consolidate() {
    const SIMILARITY_THRESHOLD = 0.92;
    const merged = [];
    const used   = new Set();

    for (let i = 0; i < this.memories.length; i++) {
      if (used.has(i)) continue;

      const cluster = [this.memories[i]];
      used.add(i);

      for (let j = i + 1; j < this.memories.length; j++) {
        if (used.has(j)) continue;
        const sim = this._cosineSimilarity(
          this.memories[i].embedding,
          this.memories[j].embedding
        );
        if (sim > SIMILARITY_THRESHOLD) {
          cluster.push(this.memories[j]);
          used.add(j);
        }
      }

      if (cluster.length === 1) {
        merged.push(cluster[0]);
      } else {
        // Merge: keep the one with highest importance + access count
        // In a real system, generate a summary using a small LLM
        const best = cluster.reduce((a, b) =>
          (a.importance + a.accessCount) > (b.importance + b.accessCount) ? a : b
        );
        merged.push({
          ...best,
          text: cluster.map(m => m.text).join(' | '),  // naive merge
          importance: Math.max(...cluster.map(m => m.importance)),
        });
      }
    }

    this.memories = merged;
    await this._saveToStorage();
    return { before: this.memories.length + (used.size - merged.length), after: merged.length };
  }

  // ── Persistence ────────────────────────────────────────────────────────────
  async _saveToStorage() {
    // OPFS: fast, private, persistent browser storage
    // Available in all modern browsers via navigator.storage.getDirectory()
    const root   = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle('mempalace.json', { create: true });
    const writer = await handle.createWritable();
    await writer.write(JSON.stringify(this.memories));
    await writer.close();
  }

  async _loadFromStorage() {
    try {
      const root   = await navigator.storage.getDirectory();
      const handle = await root.getFileHandle('mempalace.json');
      const file   = await handle.getFile();
      const text   = await file.text();
      this.memories = JSON.parse(text);
    } catch {
      this.memories = [];  // First launch: no storage yet
    }
  }

  // ── Math ───────────────────────────────────────────────────────────────────
  _cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot   += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const memPalace = new BrowserMemPalace();
```

---

## 8.4 Performance Characteristics of Browser MemPalace

```
┌──────────────────────────────────────────────────────────────────┐
│           BROWSER MEMPALACE PERFORMANCE ESTIMATES                 │
│                                                                  │
│  Operation         Latency       Notes                          │
│  ─────────────     ───────────   ────────────────────────────   │
│  remember()        25-50ms       Embedding + OPFS write         │
│  recall()          5-15ms        Embedding + JS vector search   │
│    (1k memories)                                                │
│  recall()          30-80ms       Embedding + JS vector search   │
│    (10k memories)                (linear scan)                  │
│  recall()          5-20ms        Embedding + HNSW index         │
│    (100k memories)               (use usearch library)          │
│  consolidate()     500ms-2s      Clustering + OPFS write        │
│    (10k memories)                                               │
│                                                                  │
│  Storage: ~400 bytes/memory (text + 384-dim float32 embedding)  │
│  1k memories ≈ 400KB. 100k memories ≈ 40MB.                    │
└──────────────────────────────────────────────────────────────────┘
```

For more than ~10k memories, replace the linear cosine similarity scan with a proper ANN index. The `usearch` library has a WASM build that supports HNSW indexing in the browser:

```bash
npm install usearch
```

```javascript
// Fast ANN search with usearch
import { Index } from 'usearch';

const index = new Index({ metric: 'cos', dimensions: 384 });

// Build index from memories
for (const [i, memory] of memories.entries()) {
  index.add(i, new Float32Array(memory.embedding));
}

// Search
const results = index.search(new Float32Array(queryEmbedding), 5);
// Returns top-5 results with distances in ~1ms for 100k vectors
```

---

## 8.5 The Honest Assessment

**Can the existing MemPalace GitHub project run in the browser?**
No. It has a Python/FastAPI server that cannot be executed in a browser environment.

**Can MemPalace's concepts run in the browser?**
Yes, completely. Everything it does — embedding, vector storage, retrieval, consolidation — has a browser-native equivalent.

**Is a browser MemPalace production-ready?**
For up to ~10k memories: yes, with the `BrowserMemPalace` implementation above.
For 10k-1M memories: yes, with `usearch` for ANN indexing.
For > 1M memories: consider a hybrid — local index for recent/frequent memories, server sync for historical.

**Should I reimplement it or fork it?**
Fork the concepts, not the code. The Python server is not worth porting. Write the browser version from scratch using Transformers.js + OPFS + usearch. It will be cleaner and faster than a direct port.

---

*In the next chapter, we bring together everything — training, quantization, browser inference, and systems design — into a complete worked example: building a production AI feature from idea to deployment.*
-e 

---


# Chapter 9 — Production: End to End

## 9.1 The Complete Pipeline

Every production AI feature you build follows the same pipeline. Here it is, collapsed to a single diagram:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                  COMPLETE SMALL-MODEL AI PIPELINE                         │
│                                                                          │
│  PHASE 1: UNDERSTAND THE TASK                                            │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Define inputs and outputs precisely.                            │    │
│  │  "Given a natural language schedule, output a cron expression."  │    │
│  │  Measure what "correct" means before writing any code.           │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│  PHASE 2: BUILD THE DATASET                                              │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Generate synthetic examples (trainingData.ts)                   │    │
│  │  Add real examples where you have them                           │    │
│  │  Audit for correctness, coverage, consistency                    │    │
│  │  Split: 90% train / 5% val / 5% test (never touch test early)   │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│  PHASE 3: CHOOSE BASE MODEL + FINE-TUNE                                  │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Select base model (task type determines architecture)           │    │
│  │  Fine-tune with early stopping on validation metric             │    │
│  │  Watch for overfitting (train loss < val loss = bad)            │    │
│  │  Evaluate exactly once on test set                              │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│  PHASE 4: COMPRESS                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Export to ONNX                                                  │    │
│  │  Apply int8 dynamic quantization                                 │    │
│  │  Benchmark: accuracy within 1% of float32 baseline              │    │
│  │  Benchmark: latency on target hardware                          │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│  PHASE 5: DEPLOY                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Upload to HuggingFace Hub (or self-host)                        │    │
│  │  Build Web Worker with Transformers.js                           │    │
│  │  Implement graceful loading states in UI                         │    │
│  │  Test offline (disable network, verify everything still works)  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│  PHASE 6: MONITOR + IMPROVE                                              │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Log cases where model output was wrong (with user consent)      │    │
│  │  Add those cases to your training dataset                        │    │
│  │  Retrain on schedule (weekly/monthly)                            │    │
│  │  Version your models (v1, v2...) so you can roll back            │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 9.2 Model Versioning and Updates

Unlike a software library, a model update changes behaviour in ways that are hard to predict. You need a versioning strategy:

```javascript
// model-manifest.json — ship this with your app
{
  "models": {
    "cron-translator": {
      "v1": {
        "url": "https://your-cdn.com/models/cron-translator-v1/",
        "checksum": "sha256:abc123...",
        "size_bytes": 31457280,
        "min_app_version": "1.0.0"
      },
      "v2": {
        "url": "https://your-cdn.com/models/cron-translator-v2/",
        "checksum": "sha256:def456...",
        "size_bytes": 28311552,
        "min_app_version": "1.2.0"
      },
      "current": "v2"
    }
  }
}
```

```javascript
// model-updater.js
// Mental model: check for model updates at app start, but don't
// force the user to wait. Download in the background and switch
// to the new version on the next app launch.

async function checkForModelUpdate() {
  const manifest = await fetch('/model-manifest.json').then(r => r.json());
  const latest   = manifest.models['cron-translator'].current;
  const installed = localStorage.getItem('model-version');

  if (latest !== installed) {
    // Download new model in the background
    console.log(`Downloading model update: ${installed} → ${latest}`);
    await downloadModel(manifest.models['cron-translator'][latest]);
    localStorage.setItem('model-version', latest);
    // New version takes effect on next app launch
  }
}
```

---

## 9.3 The Privacy Architecture

One of the most important advantages of on-device models is privacy. Make it explicit in your architecture:

```
┌──────────────────────────────────────────────────────────────────┐
│              DATA FLOW: ON-DEVICE vs CLOUD                        │
│                                                                  │
│  ON-DEVICE (never leaves browser/device):                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  User inputs → Model inference → Results                 │   │
│  │  MemPalace memories → Embeddings → Vector search         │   │
│  │  Document processing → Classification → Actions          │   │
│  │                                                          │   │
│  │  ✓ No server logs of user data                           │   │
│  │  ✓ Works with sensitive documents (legal, medical, HR)   │   │
│  │  ✓ GDPR-friendly: data stays with the user              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  TO SERVER (only when explicitly needed):                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  User authentication                                     │   │
│  │  Syncing preferences/settings (not raw documents)        │   │
│  │  API calls the user explicitly initiates                 │   │
│  │  Analytics (opt-in, anonymised only)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

This architecture is a feature, not just a technical choice. Market it as such.

---

## 9.4 Testing Your AI System

AI systems require a different testing approach from regular software because outputs are probabilistic, not deterministic.

```javascript
// ai-tests.js
// Mental model: test the behaviour contract, not the exact output.
// "The model should produce a valid cron expression" is testable.
// "The model should produce exactly '0 9 * * 1-5'" is too brittle.

import { describe, test, expect } from 'vitest';
import { modelClient } from './ModelClient';

describe('Cron Translator', () => {
  // Contract: output must be a valid 5-field cron expression
  const CRON_REGEX = /^([*\d\/,-]+)\s+([*\d\/,-]+)\s+([*\dL\/,-]+)\s+([*\d\/,-]+)\s+([*\d\/,-]+)$/;

  test.each([
    ['every weekday at 9am',       '0 9 * * 1-5'],
    ['every 15 minutes',           '*/15 * * * *'],
    ['every day at midnight',      '0 0 * * *'],
    ['first of the month at noon', '0 12 1 * *'],
  ])('translates "%s" to "%s"', async (input, expected) => {
    const output = await modelClient.infer(input);

    // Hard requirement: must be a valid cron expression
    expect(output).toMatch(CRON_REGEX);

    // Soft requirement: exact match (may fail for paraphrase-equivalent outputs)
    expect(output).toBe(expected);
  });

  // Robustness tests: the model should handle unusual phrasings gracefully
  test('handles uppercase input', async () => {
    const output = await modelClient.infer('EVERY WEEKDAY AT 9AM');
    expect(output).toMatch(CRON_REGEX);
  });

  test('handles extra whitespace', async () => {
    const output = await modelClient.infer('  every   day  at  midnight  ');
    expect(output).toMatch(CRON_REGEX);
  });
});
```

---

## 9.5 The Skills You Now Have

By working through this book, you have acquired a complete stack of AI engineering skills:

```
┌──────────────────────────────────────────────────────────────────┐
│                   YOUR NEW SKILL STACK                            │
│                                                                  │
│  ■ Dataset design                                                │
│    You can design, generate, and audit training datasets         │
│    for any supervised learning task.                             │
│                                                                  │
│  ■ Fine-tuning                                                   │
│    You can take any HuggingFace model and fine-tune it          │
│    on your domain using full FT or LoRA.                        │
│                                                                  │
│  ■ Quantization                                                  │
│    You can compress models to 25% of their original size        │
│    with < 1% accuracy loss, using PTQ or QAT.                   │
│                                                                  │
│  ■ ONNX export                                                   │
│    You can export any PyTorch model to the universal ONNX        │
│    format, making it runnable in any environment.               │
│                                                                  │
│  ■ Browser inference                                             │
│    You can run ONNX models in the browser via Transformers.js,  │
│    with proper Web Worker architecture, caching, and loading    │
│    states.                                                       │
│                                                                  │
│  ■ Mobile deployment                                             │
│    You can deploy models to React Native apps and native iOS/   │
│    Android via CoreML and ONNX Runtime.                         │
│                                                                  │
│  ■ AI systems design                                             │
│    You can compose multiple specialist models into compound      │
│    systems that outperform single large models on complex        │
│    tasks.                                                        │
│                                                                  │
│  ■ RAG at the edge                                               │
│    You can build retrieval-augmented systems that run entirely   │
│    offline using embeddings, vector storage, and OPFS.           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 9.6 What to Build Next

The fastest way to solidify these skills is to build real projects. Here are five, in order of increasing complexity:

1. **Intent classifier for your own app** — 3 classes, distilbert-base, 500 examples, browser deployment. One weekend.

2. **Offline document search** — embed your docs, ship the vectors with the app, MiniLM similarity search. Two weekends.

3. **Domain-specific autocomplete** — fine-tune GPT-2-small on your domain's text, run in the browser as you type. Two weekends.

4. **On-device OCR + classifier** — Tesseract.js (OCR) + fine-tuned distilbert (classify what was scanned). One month.

5. **Full offline AI assistant** — MemPalace + RAG + flan-t5-base + browser. Your domain, your data, your device. Three months.

---

## 9.7 The Frontier

The models we have worked with in this book are already impressive. But the frontier is moving fast:

```
CAPABILITY TIMELINE (approximate):
───────────────────────────────────────────────────────────────
2022: whisper-tiny (39MB) — real-time speech-to-text in browser
2023: phi-2 (2.7B, ~1.5GB int4) — instruction following on laptop
2024: phi-3-mini (3.8B, ~2.3GB int4) — near-GPT-3.5 quality, browser-edge
2025: gemma-2b (2B, ~1.2GB int4) — strong reasoning, mobile-capable
????: sub-100MB model with GPT-4-level reasoning on specific domains?
      (this is what fine-tuning is reaching toward)
───────────────────────────────────────────────────────────────
```

The direction is clear: models are getting smaller and more capable simultaneously. The techniques in this book — fine-tuning, quantization, systems composition — become *more* valuable as models improve, not less. The engineer who understands these fundamentals will be able to exploit whatever the next generation of small models offers.

You are now that engineer.

---

*The appendices that follow contain reference material: the full command reference, a model compatibility matrix, and a troubleshooting guide for common training failures.*
-e 

---


# Appendices

---

## Appendix A — Quick-Reference Command Sheet

### Environment Setup
```bash
# Python training environment
python -m venv .venv && source .venv/bin/activate
pip install torch transformers datasets accelerate optimum[exporters] evaluate peft

# JavaScript inference environment
npm install @xenova/transformers
npm install usearch  # for large-scale vector search
```

### Full Training Run (copy-paste ready)
```bash
# 1. Generate dataset
npx ts-node lib/ai/trainingData.ts > data/training.jsonl

# 2. Fine-tune
python scripts/finetune.py \
  --model google/flan-t5-small \
  --data data/training.jsonl \
  --output checkpoints/my-model \
  --epochs 10 \
  --batch-size 32 \
  --lr 3e-4

# 3. Export to ONNX
python -m optimum.exporters.onnx \
  --model checkpoints/my-model/final \
  --task text2text-generation \
  exports/my-model-onnx/

# 4. Quantize to int8
python scripts/quantize.py \
  --input exports/my-model-onnx/ \
  --output exports/my-model-int8/

# 5. Upload to HuggingFace Hub
huggingface-cli login
huggingface-cli upload your-org/my-model exports/my-model-int8/
```

### LoRA Fine-tuning (large models)
```bash
pip install peft
python scripts/finetune_lora.py \
  --model google/flan-t5-base \
  --r 8 \
  --lora-alpha 16 \
  --target-modules "q,v"
```

### Merge LoRA adapters before export
```python
from peft import PeftModel
from transformers import AutoModelForSeq2SeqLM

base    = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-base")
model   = PeftModel.from_pretrained(base, "checkpoints/my-lora")
merged  = model.merge_and_unload()   # fuse adapter weights into base
merged.save_pretrained("checkpoints/my-model-merged")
```

---

## Appendix B — Model Compatibility Matrix

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                         MODEL COMPATIBILITY MATRIX                             │
├────────────────────┬────────┬───────────────────────────────────────────────┐ │
│ Model              │ Size   │ Browser  Mobile  ONNX  LoRA  FT    Quantize   │ │
├────────────────────┼────────┼────────────────────────────────────────────────┤ │
│ flan-t5-small      │  77M   │   ✅      ✅      ✅    ✅    ✅     int8/int4 │ │
│ flan-t5-base       │ 250M   │   ✅      ⚠️      ✅    ✅    ✅     int8/int4 │ │
│ distilbert-base    │  66M   │   ✅      ✅      ✅    ✅    ✅     int8/int4 │ │
│ bert-base          │ 110M   │   ✅      ✅      ✅    ✅    ✅     int8/int4 │ │
│ MiniLM-L6-v2       │  22M   │   ✅      ✅      ✅    ✅    ✅     int8      │ │
│ GPT-2-small        │ 117M   │   ✅      ⚠️      ✅    ✅    ✅     int8/int4 │ │
│ whisper-tiny       │  39M   │   ✅      ✅      ✅    ✅    ✅     int8      │ │
│ whisper-base       │  74M   │   ✅      ✅      ✅    ✅    ✅     int8      │ │
│ phi-3-mini (int4)  │ 3.8B   │   ⚠️      ❌      ✅    ✅    ⚠️     int4      │ │
│ llama-3.2-1b (q4)  │  1B    │   ⚠️      ⚠️      ✅    ✅    ⚠️     int4      │ │
├────────────────────┴────────┴────────────────────────────────────────────────┘ │
│  ✅ = works well    ⚠️ = works with caveats    ❌ = not recommended           │
│  ⚠️ Browser: works in Chrome with WebGPU, slow on WASM                       │
│  ⚠️ Mobile: high memory pressure, thermal throttling risk                     │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Appendix C — Troubleshooting Guide

### Training Issues

**Problem: Loss is NaN from the first step**
```
Cause:    Learning rate too high, causing weight explosion.
Fix:      Reduce LR by 10x. Try 1e-5 for BERT models, 1e-4 for T5.
          Add gradient clipping: max_grad_norm=1.0 in TrainingArguments.
```

**Problem: Validation loss increases while training loss decreases**
```
Cause:    Overfitting. Model is memorising training data.
Fix:      (1) Reduce num_train_epochs. Stop earlier.
          (2) Increase weight_decay (try 0.1).
          (3) Use LoRA instead of full fine-tuning.
          (4) Add more training data.
          (5) Increase lora_dropout if using LoRA.
```

**Problem: Accuracy plateaus at 70-80% and won't improve**
```
Cause:    Underfitting. Model capacity or data is insufficient.
Fix:      (1) Train for more epochs.
          (2) Use a larger base model (small→base).
          (3) Increase learning rate slightly.
          (4) Add more varied training examples.
          (5) Check dataset for systematic errors (wrong labels).
```

**Problem: OOM (Out of Memory) during training**
```
Cause:    Batch size too large for available GPU memory.
Fix:      (1) Reduce per_device_train_batch_size by 2x.
          (2) Use gradient_accumulation_steps=4 to simulate larger batch.
          (3) Use fp16=True (half precision uses half the memory).
          (4) Switch from full fine-tuning to LoRA.
          (5) Use smaller max_length for inputs.
```

### Export / Quantization Issues

**Problem: ONNX export fails with "symbolic shape inference" error**
```
Cause:    Dynamic shapes not handled correctly.
Fix:      Add --no-post-process flag to optimum export command.
          Or set dynamic_axes explicitly in torch.onnx.export.
```

**Problem: Quantized model gives wrong outputs (accuracy drops > 5%)**
```
Cause:    PTQ didn't find good quantization parameters.
Fix:      (1) Use calibration dataset (static quantization).
          (2) Try QAT (Quantization-Aware Training).
          (3) Use int8 instead of int4.
          (4) Exclude the first and last layers from quantization
              (they are most sensitive to precision loss).
```

### Browser Inference Issues

**Problem: Model loads but inference is very slow (> 1 second)**
```
Cause:    WASM not using multiple threads.
Fix:      Ensure page is served with these headers:
          Cross-Origin-Opener-Policy: same-origin
          Cross-Origin-Embedder-Policy: require-corp
          These are required for SharedArrayBuffer (multi-threading).
```

**Problem: "SharedArrayBuffer is not defined"**
```
Cause:    Missing COOP/COEP headers (see above).
Fix:      Add headers to your server/CDN configuration.
          Vercel: vercel.json → headers array
          Netlify: _headers file
          Next.js: next.config.js → headers() function
```

**Problem: Model downloads every time (cache not working)**
```
Cause:    env.useBrowserCache = false, or cache quota exceeded.
Fix:      (1) Verify env.useBrowserCache = true in worker.
          (2) Check DevTools → Application → Cache Storage.
          (3) Request persistent storage: 
              await navigator.storage.persist()
              This prevents the browser from evicting the cache.
```

**Problem: Web Worker fails to import Transformers.js**
```
Cause:    Worker was not created with { type: 'module' }.
Fix:      new Worker(url, { type: 'module' })
          Inline workers (Blob URLs) also need type: 'module'.
```

---

## Appendix D — Recommended Learning Path

**Week 1: Foundations**
- Run the fine-tuning script on a toy dataset (100 examples)
- Watch the loss curve in real time
- Experiment with learning rates: too high, too low, just right
- Goal: understand what training is actually doing

**Week 2: Your First Real Model**
- Pick a task from your current project
- Generate 1,000+ synthetic examples
- Fine-tune distilbert or flan-t5-small
- Evaluate on a held-out test set
- Goal: deploy one real model, even if imperfect

**Week 3: Compression and Deployment**
- Export your week-2 model to ONNX
- Apply int8 quantization
- Run it in the browser with Transformers.js
- Measure latency, verify accuracy
- Goal: model working offline in a browser tab

**Week 4: Systems Thinking**
- Add a second model (embeddings for search, or a classifier as a gate)
- Implement a simple RAG pipeline with OPFS storage
- Build the ModelClient pattern from chapter 5
- Goal: two models working together as a system

**Month 2+: Mastery**
- LoRA on a 1B+ parameter model
- QAT for a model where PTQ accuracy is insufficient
- WebGPU acceleration for a model that benefits from it
- BrowserMemPalace implementation
- Continuous training loop: collect errors → retrain → redeploy

---

## Appendix E — Key Resources

**Libraries**
- `transformers` — HuggingFace Python library: training, fine-tuning, evaluation
- `datasets` — HuggingFace dataset library: loading, processing, splitting
- `optimum` — HuggingFace optimisation: ONNX export, quantization
- `peft` — HuggingFace LoRA and adapter library
- `@xenova/transformers` — Transformers.js: browser and Node.js inference
- `onnxruntime-react-native` — ONNX inference for React Native
- `usearch` — Fast approximate nearest-neighbour search (WASM-compatible)
- `coremltools` — Apple CoreML conversion

**Compute for Training (free/cheap)**
- Google Colab (free T4 GPU, 15GB VRAM) — fine-tunes flan-t5-small in ~20min
- Kaggle Notebooks (free P100 GPU) — 30 hours/week
- HuggingFace Spaces with GPU — $0.60/hour for A10G
- RunPod.io — $0.34/hour for RTX 3090

**Model Hub**
- HuggingFace Hub — home of every model in this book
  Model search: huggingface.co/models
  Your models: huggingface.co/your-username

**Reading**
- "Attention Is All You Need" — the original transformer paper (2017)
- "LoRA: Low-Rank Adaptation of Large Language Models" (2021)
- "LLM.int8(): 8-bit Matrix Multiplication for Transformers" (2022)
- HuggingFace documentation — comprehensive and well-maintained

---

*End of The Offline AI Engineer*

---

> **A note on pace:** AI capabilities are advancing faster than any book can track. The specific models named here will be superseded. The techniques will not. Fine-tuning, quantization, ONNX export, Web Worker inference — these are the durable skills. Learn them deeply and you will be able to exploit whatever comes next.