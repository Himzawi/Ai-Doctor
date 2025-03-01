import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import {
  FaStethoscope,
  FaUserMd,
  FaPills,
  FaSpinner,
  FaExclamationTriangle,
  FaThermometerHalf,
  FaClipboardCheck,
  FaChevronDown,
  FaNotesMedical
} from 'react-icons/fa';

function AIDoctorApp() {
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('male');
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [severity, setSeverity] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [symptomsArray, setSymptomsArray] = useState([]);

  const commonSymptoms = [
    "Fever", "Headache", "Cough", "Fatigue",
    "Sore throat", "Nausea", "Dizziness", "Shortness of breath",
    "Chest pain", "Back pain", "Joint pain", "Rash"
  ];

  const addSymptom = (symptom) => {
    if (!symptomsArray.includes(symptom)) {
      const newSymptomsArray = [...symptomsArray, symptom];
      setSymptomsArray(newSymptomsArray);
      setSymptoms(newSymptomsArray.join(', '));
    }
  };

  const removeSymptom = (symptomToRemove) => {
    const newSymptomsArray = symptomsArray.filter(s => s !== symptomToRemove);
    setSymptomsArray(newSymptomsArray);
    setSymptoms(newSymptomsArray.join(', '));
  };

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'mild':
        return '#4caf50';
      case 'moderate':
        return '#ff9800';
      case 'severe – seek medical attention':
      case 'severe':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('https://ai-doctor-backend-sekj.onrender.com', {
        age: parseInt(age),
        sex,
        symptoms: symptomsArray.join(', ')
      });

      setSeverity(response.data.severity);
      setDiagnosis(response.data.diagnosis);
      setTreatment(response.data.treatment);

      setLoading(false);
      setSubmitted(true);
    } catch (error) {
      console.error('Error fetching diagnosis:', error);
      setLoading(false);
      alert('Failed to fetch diagnosis. Please try again.');
    }
  };

  const formatBulletPoints = (text) => {
    if (!text) return [];
    return text.split('\n').map((line, index) => (
      <p key={index} className="bullet-point">{line}</p>
    ));
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="header-title">
            <FaStethoscope />
            AI Doctor
          </h1>
          <p className="header-subtitle">Your intelligent healthcare assistant</p>
        </div>
        <div className="header-decoration">
          <div className="circle1"></div>
          <div className="circle2"></div>
          <div className="circle3"></div>
        </div>
      </header>

      <main className="app-content">
        {!submitted ? (
          <div className="form-wrapper">  {/* Add wrapper for form animation */}
            <h2 className="form-title">
              <FaClipboardCheck /> Tell us how you're feeling
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className={`form-field ${focusedField === 'age' ? 'focused' : ''}`}>
                  <label className="field-label">
                    <FaUserMd /> Age
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    onFocus={() => setFocusedField('age')}
                    onBlur={() => setFocusedField(null)}
                    className="field-input"
                    placeholder="Enter your age"
                    required
                  />
                </div>

                <div className={`form-field ${focusedField === 'sex' ? 'focused' : ''}`}>
                  <label className="field-label">
                    <FaUserMd /> Sex
                  </label>
                  <div className="select-wrapper">
                    <select
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                      onFocus={() => setFocusedField('sex')}
                      onBlur={() => setFocusedField(null)}
                      className="field-select"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                    <div className="select-icon">
                      <FaChevronDown />
                    </div>
                  </div>
                </div>

                <div className={`form-field symptoms-field ${focusedField === 'symptoms' ? 'focused' : ''}`}>
                  <label className="field-label">
                    <FaNotesMedical /> Symptoms
                  </label>
                  <input
                    type="text"
                    value={symptoms}
                    onChange={(e) => {
                      setSymptoms(e.target.value);
                      const newSymptoms = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                      setSymptomsArray(newSymptoms);
                    }}
                    onFocus={() => setFocusedField('symptoms')}
                    onBlur={() => setFocusedField(null)}
                    className="field-input"
                    placeholder="Enter symptoms (fever, headache, etc.)"
                    required
                  />

                  {symptomsArray.length > 0 && (
                    <div className="symptom-tags">
                      {symptomsArray.map((symptom, index) => (
                        <div key={index} className="symptom-tag">
                          {symptom}
                          <button
                            type="button"
                            onClick={() => removeSymptom(symptom)}
                            className="tag-remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="suggestions-title">Common symptoms:</p>
                  <div className="suggestions-container">
                    {commonSymptoms.map((symptom, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => addSymptom(symptom)}
                        className="suggestion-button"
                      >
                        + {symptom}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="form-button"
              >
                {loading ? (
                  <>
                    <FaSpinner className="spinner" />
                    <span>Analyzing Symptoms...</span>
                  </>
                ) : (
                  <>
                    <FaStethoscope />
                    <span>Get Diagnosis</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="results-container">
            <h2 className="results-title">
              <FaStethoscope />
              Your Health Assessment
            </h2>

            <div className="patient-summary">
              <div className="summary-grid">
                <div className="summary-field">
                  <p className="summary-label">Age:</p>
                  <p className="summary-value">{age} years</p>
                </div>
                <div className="summary-field">
                  <p className="summary-label">Sex:</p>
                  <p className="summary-value" style={{ textTransform: 'capitalize' }}>{sex}</p>
                </div>
                <div className="summary-field symptoms-summary">
                  <p className="summary-label">Reported Symptoms:</p>
                  <p className="summary-value">{symptoms}</p>
                </div>
              </div>
            </div>

            <div
              className="severity-container"
              style={{ backgroundColor: getSeverityColor(severity) }}
            >
              <div className="severity-icon">
                <FaExclamationTriangle />
              </div>
              <div>
                <div className="severity-label">Condition Assessment</div>
                <div className="severity-value">{severity}</div>
              </div>
            </div>

            <div>
              <div className="results-card">
                <div className="card-header">
                  <div className="card-icon diagnosis-icon">
                    <FaStethoscope />
                  </div>
                  <h3 className="card-title">Diagnosis</h3>
                </div>
                <div className="card-content diagnosis-content">
                  {formatBulletPoints(diagnosis)}
                </div>
              </div>

              <div className="results-card">
                <div className="card-header">
                  <div className="card-icon treatment-icon">
                    <FaPills />
                  </div>
                  <h3 className="card-title">Recommended Treatment</h3>
                </div>
                <div className="card-content treatment-content">
                  {formatBulletPoints(treatment)}
                </div>
              </div>

              <div className="disclaimer">
                <p className="disclaimer-title">Important disclaimer:</p>
                <p>This AI-generated information is not a substitute for professional medical advice. Always consult a qualified healthcare provider for proper diagnosis and treatment.</p>
              </div>
            </div>

            <button
              onClick={() => setSubmitted(false)}
              className="back-button"
            >
              Start New Assessment
            </button>
          </div>
        )}
      </main>

      <footer className="app-footer">
        © 2025 AI Doctor. All rights reserved. For educational purposes only.
      </footer>
    </div>
  );
}

export default AIDoctorApp;