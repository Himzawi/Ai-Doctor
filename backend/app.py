from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import json
import re  
from dotenv import load_dotenv  


load_dotenv()

app = Flask(__name__)


cors = CORS(app, resources={r"/diagnose": {"origins": "https://ai-doctor-frontend.onrender.com"}})


OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

def parse_ai_response(response_text):
    """
    Parse the AI response to extract severity, diagnosis, and treatment.
    """
    severity_pattern = r"(Mild|Moderate|Severe – Seek Medical Attention)"
    severity_match = re.search(severity_pattern, response_text, re.IGNORECASE)
    severity = severity_match.group(1) if severity_match else "Unknown"

    
    diagnosis_pattern = r"Diagnosis:(.*?)(Treatment:|$)"
    treatment_pattern = r"Treatment:(.*)"
    diagnosis_match = re.search(diagnosis_pattern, response_text, re.DOTALL)
    treatment_match = re.search(treatment_pattern, response_text, re.DOTALL)

    diagnosis = diagnosis_match.group(1).strip() if diagnosis_match else "No diagnosis provided."
    treatment = treatment_match.group(1).strip() if treatment_match else "No treatment provided."

    return severity, diagnosis, treatment

@app.route('/diagnose', methods=['POST'])
def diagnose():
    data = request.get_json()  
    symptoms = data.get('symptoms')
    age = data.get('age')
    sex = data.get('sex')

    print("Received data:", data)  

    
    if not symptoms or not age or not sex:
        return jsonify({"error": "Missing required data (symptoms, age, sex)"}), 400

  
    prompt = f"A {age}-year-old {sex} presents with the following symptoms: {symptoms}. Provide a clear response with the following structure:\n\nSeverity: [Mild/Moderate/Severe – Seek Medical Attention]\nDiagnosis: [Your diagnosis here]\nTreatment: [Your treatment recommendations here]"

    try:
       
        print("Sending request to OpenRouter API...")  
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://ai-doctor-frontend.onrender.com",
                "X-Title": "AI Doctor"
            },
            data=json.dumps({
                "model": "deepseek/deepseek-chat:free",
                "messages": [
                    {"role": "system", "content": "You are a helpful AI doctor. Always provide a clear response with the following structure:\n\nSeverity: [Mild/Moderate/Severe – Seek Medical Attention]\nDiagnosis: [Your diagnosis here]\nTreatment: [Your treatment recommendations here]"},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 500
            })
        )
        print("OpenRouter API Response Status Code:", response.status_code)  
        print("OpenRouter API Response Content:", response.text)  
        response.raise_for_status()  

     
        result = response.json()["choices"][0]["message"]["content"].strip()
        print("OpenRouter API Response:", result)  

        
        severity, diagnosis, treatment = parse_ai_response(result)

     
        return jsonify({
            "severity": severity,
            "diagnosis": diagnosis,
            "treatment": treatment
        })
    except requests.exceptions.RequestException as e:
        print("OpenRouter API Request Error:", str(e))  
        return jsonify({"error": "Failed to connect to OpenRouter API"}), 500
    except Exception as e:
        print("Error:", str(e))  
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
