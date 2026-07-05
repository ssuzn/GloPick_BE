# 🌍 GloPick

> **AI 기반 해외 이주 · 취업 국가 추천 플랫폼**

사용자의 직무, 언어 능력, 삶의 질 선호도를 기반으로
해외 취업 및 이주에 적합한 국가를 추천하는 서비스입니다.

단순 LLM 추천이 아닌 **OECD, World Bank, ILOSTAT 공공데이터**를 활용하여
추천 결과의 신뢰성과 일관성을 높였습니다.

## ✨ Features

### 🤖 AI Recommendation
- GPT 기반 국가 및 도시 추천
- 사용자 가중치 기반 개인화 추천
- 추천 근거 및 점수 제공

### 📊 Data Processing
- Python ETL Pipeline 구축
- OECD · World Bank · ILOSTAT 데이터 통합
- Box-Cox Transformation
- Z-Score Normalization

### 🔐 Authentication
- JWT 기반 로그인
- 추천 결과 저장 및 조회

## 🏗️ Architecture

```text
                  OECD / World Bank / ILOSTAT
                              │
                              ▼
                    Python ETL Pipeline
      Validation → Cleaning → Box-Cox → Z-Score
                              │
                              ▼
                  oecd_processed.json
                              │
                              ▼
                    Node.js Recommendation API
                              │
                              ▼
                     React Frontend (Vite)
```


## ⚙️ Tech Stack


| Category | Technologies |
|----------|--------------|
| 🎨 Frontend | React · TypeScript · Zustand · Axios · Tailwind CSS |
| ⚙️ Backend | Node.js · Express · TypeScript |
| 📈 Data | Python · Pandas · NumPy · SciPy · Matplotlib |
| 🤖 AI | OpenAI API |
| 🌍 Data Source | OECD Better Life Index · World Bank · ILOSTAT |


## 📊 Python ETL Pipeline

공공데이터를 서비스에서 활용하기 위해
Python 기반 ETL 파이프라인을 구축하여
데이터 검증부터 정규화, 시각화를 자동화했습니다.

#### Pipeline

```text
Raw CSV
   │
   ▼
Validation
   │
   ▼
Missing Value Imputation
   │
   ▼
Percentile Clipping
   │
   ▼
Box-Cox Transformation
   │
   ▼
Z-Score Normalization
   │
   ▼
0~100 Score Scaling
   │
   ▼
Visualization
   │
   ▼
JSON Export
```

#### Processing Features

- 데이터 검증(Validation)
- 결측치 중앙값 대체(Median Imputation)
- 이상치 완화(Percentile Clipping)
- Box-Cox 변환
- Z-Score 표준화
- 0~100 점수 변환
- 통계 정보 자동 생성
- 분포 시각화 자동 생성
- pytest 기반 단위 테스트


## 📂 Project Structure

```text
src/
 ├── controllers
 ├── services
 ├── routes
 └── ...

preprocessing/
 ├── validator.py
 ├── cleaner.py
 ├── transformer.py
 ├── exporter.py
 └── visualizer.py

tests/
scripts/
data/
```

## 🚀 Getting Started

### 1. Install Node Packages

```bash
npm install
```

### 2. Create Python Virtual Environment

```bash
python -m venv .venv
```

### 3. Activate Virtual Environment
macOS / Linux
```bash
source .venv/bin/activate
```

Windows

```bash
.venv\Scripts\activate
```

### 4. Install Python Packages

```bash
pip install -r requirements.txt
```

### 5. Run ETL

```bash
npm run preprocess:oecd
```

### 6. Run Backend

```bash
npm run dev
```

### 7. Run Tests

Python

```bash
npm run test:python
```

Backend

```bash
npm run build
```

## 📈 Data Sources

```md
- OECD Better Life Index
- World Bank
- ILOSTAT
- OpenAI API
```
