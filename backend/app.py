from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import json
import re  # For regex to extract severity, diagnosis, and treatment

app = Flask(__name__)

# *** IMPORTANT:  SPECIFY YOUR FRONTEND ORIGIN PRECISELY ***
# Replace with your frontend URL.  DO NOT use "*" in production.
cors = CORS(app, resources={r"/diagnose": {"origins": "https://ai-doctor-frontend.onrender.com"}})

# Replace with your OpenRouter API key
OPENROUTER_API_KEY = os.getenv("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")

def parse_ai_response(response_text):
    """
    Parse the AI response to extract severity, diagnosis, and treatment.
    """
    # Extract severity
    severity_pattern = r"(Mild|Moderate|Severe – Seek Medical Attention)"
    severity_match = re.search(severity_pattern, response_text, re.IGNORECASE)
    severity = severity_match.group(1) if severity_match else "Unknown"

    # Extract diagnosis and treatment
    diagnosis_pattern = r"Diagnosis:(.*?)(Treatment:|$)"
    treatment_pattern = r"Treatment:(.*)"
    diagnosis_match = re.search(diagnosis_pattern, response_text, re.DOTALL)
    treatment_match = re.search(treatment_pattern, response_text, re.DOTALL)

    diagnosis = diagnosis_match.group(1).strip() if diagnosis_match else "No diagnosis provided."
    treatment = treatment_match.group(1).strip() if treatment_match else "No treatment provided."

    return severity, diagnosis, treatment

@app.route('/diagnose', methods=['POST'])
def diagnose():
    data = request.get_json()  # Use request.get_json() instead of request.json
    symptoms = data.get('symptoms')
    age = data.get('age')
    sex = data.get('sex')

    print("Received data:", data)  # Log the incoming data

    # Validate incoming data
    if not symptoms or not age or not sex:
        return jsonify({"error": "Missing required data (symptoms, age, sex)"}), 400

    # Use DeepSeek to generate a diagnosis
    prompt = f"A {age}-year-old {sex} presents with the following symptoms: {symptoms}. Provide a clear response with the following structure:\n\nSeverity: [Mild/Moderate/Severe – Seek Medical Attention]\nDiagnosis: [Your diagnosis here]\nTreatment: [Your treatment recommendations here]"

    try:
        # Make a request to OpenRouter's API
        print("Sending request to OpenRouter API...")  # Log the API request
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
        print("OpenRouter API Response Status Code:", response.status_code)  # Log the status code
        print("OpenRouter API Response Content:", response.text)  # Log the response content
        response.raise_for_status()  # Raise an error for bad status codes

        # Extract the AI response
        result = response.json()["choices"][0]["message"]["content"].strip()
        print("OpenRouter API Response:", result)  # Log the API response

        # Parse the response to extract severity, diagnosis, and treatment
        severity, diagnosis, treatment = parse_ai_response(result)

        # Return severity, diagnosis, and treatment as separate fields
        return jsonify({
            "severity": severity,
            "diagnosis": diagnosis,
            "treatment": treatment
        })
    except requests.exceptions.RequestException as e:
        print("OpenRouter API Request Error:", str(e))  # Log the request error
        return jsonify({"error": "Failed to connect to OpenRouter API"}), 500
    except Exception as e:
        print("Error:", str(e))  # Log the error
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)