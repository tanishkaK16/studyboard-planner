from flask import Flask, render_template, request, jsonify, send_from_directory
import random
import os
import json
from datetime import datetime
import base64

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ─── Motivational Quotes ───
QUOTES = [
    {"text": "The expert in anything was once a beginner.", "author": "Helen Hayes"},
    {"text": "Success is not final, failure is not fatal: it is the courage to continue that counts.", "author": "Winston Churchill"},
    {"text": "Believe you can and you're halfway there.", "author": "Theodore Roosevelt"},
    {"text": "The only way to do great work is to love what you do.", "author": "Steve Jobs"},
    {"text": "Don't watch the clock; do what it does. Keep going.", "author": "Sam Levenson"},
    {"text": "It always seems impossible until it's done.", "author": "Nelson Mandela"},
    {"text": "Education is the most powerful weapon which you can use to change the world.", "author": "Nelson Mandela"},
    {"text": "The future belongs to those who believe in the beauty of their dreams.", "author": "Eleanor Roosevelt"},
    {"text": "You don't have to be great to start, but you have to start to be great.", "author": "Zig Ziglar"},
    {"text": "Engineering is the closest thing to magic that exists in the world.", "author": "Elon Musk"},
    {"text": "The scientist discovers a new type of material or energy and the engineer discovers a new use for it.", "author": "Gordon Lindsay Glegg"},
    {"text": "Strive for progress, not perfection.", "author": "Unknown"},
    {"text": "Your limitation—it's only your imagination.", "author": "Unknown"},
    {"text": "Push yourself, because no one else is going to do it for you.", "author": "Unknown"},
    {"text": "Great things never come from comfort zones.", "author": "Unknown"},
    {"text": "Dream it. Wish it. Do it.", "author": "Unknown"},
    {"text": "Success doesn't just find you. You have to go out and get it.", "author": "Unknown"},
    {"text": "The harder you work for something, the greater you'll feel when you achieve it.", "author": "Unknown"},
    {"text": "Dream bigger. Do bigger.", "author": "Unknown"},
    {"text": "Don't stop when you're tired. Stop when you're done.", "author": "Unknown"},
    {"text": "Wake up with determination. Go to bed with satisfaction.", "author": "Unknown"},
    {"text": "Do something today that your future self will thank you for.", "author": "Sean Patrick Flanery"},
    {"text": "Little things make big days.", "author": "Unknown"},
    {"text": "It's going to be hard, but hard does not mean impossible.", "author": "Unknown"},
    {"text": "The best time to plant a tree was 20 years ago. The second best time is now.", "author": "Chinese Proverb"},
    {"text": "Your grades don't define your intelligence, and your degree doesn't define your purpose.", "author": "Unknown"},
    {"text": "An engineer is someone who figures out how to do for a dime what any fool can do for a dollar.", "author": "Unknown"},
    {"text": "Study hard, for the well is deep, and our brains are shallow.", "author": "Richard Baxter"},
    {"text": "Discipline is the bridge between goals and accomplishment.", "author": "Jim Rohn"},
    {"text": "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", "author": "Brian Herbert"},
]

# ─── Chatbot Knowledge Base ───
CHATBOT_KB = {
    "study tips": "📚 **Study Tips for Engineering Students:**\n\n1. **Active Recall** — Test yourself instead of re-reading notes\n2. **Spaced Repetition** — Review material at increasing intervals\n3. **Feynman Technique** — Explain concepts in simple terms\n4. **Pomodoro Method** — Study in 25-min focused bursts\n5. **Practice Problems** — Solve as many problems as you can\n6. **Group Study** — Discuss tough topics with classmates\n7. **Mind Maps** — Visualize connections between concepts",

    "semester prep": "📋 **Semester Preparation Guide:**\n\n1. Review the syllabus for all subjects\n2. Get recommended textbooks early\n3. Set up a study schedule/timetable\n4. Join study groups and class forums\n5. Identify lab requirements and prerequisites\n6. Set realistic goals for the semester\n7. Organize your notes system (digital/physical)\n8. Plan for assignments and project deadlines",

    "career": "💼 **Engineering Career Guidance:**\n\n1. **Build Projects** — Hands-on experience matters most\n2. **Internships** — Apply early and often\n3. **Networking** — Attend tech meetups and conferences\n4. **Online Presence** — Maintain LinkedIn and GitHub\n5. **Certifications** — AWS, Google Cloud, or domain-specific\n6. **Soft Skills** — Communication and teamwork are crucial\n7. **Research** — Consider publishing papers if academia interests you",

    "time management": "⏰ **Time Management Tips:**\n\n1. **Prioritize** — Use Eisenhower Matrix (urgent vs important)\n2. **Block Scheduling** — Dedicate time blocks for specific tasks\n3. **Avoid Multitasking** — Focus on one thing at a time\n4. **Set Deadlines** — Even for self-directed work\n5. **Use Tools** — This planner! Set daily/weekly goals\n6. **Say No** — Don't overcommit yourself\n7. **Sleep Well** — 7-8 hours is essential for productivity",

    "exam": "📝 **Exam Preparation Strategy:**\n\n1. Start preparing at least 2-3 weeks before exams\n2. Review previous years' question papers\n3. Focus on high-weightage topics first\n4. Make concise formula sheets and cheat sheets\n5. Practice numerical problems daily\n6. Take mock tests under timed conditions\n7. Don't cram the night before — rest well\n8. Eat healthy and stay hydrated during exams",

    "coding": "💻 **Coding & DSA Tips:**\n\n1. **Start with Basics** — Learn one language well (Python/C++/Java)\n2. **Data Structures** — Arrays, Linked Lists, Trees, Graphs, Hash Maps\n3. **Algorithms** — Sorting, Searching, DP, Greedy, Backtracking\n4. **Practice Daily** — LeetCode, Codeforces, HackerRank\n5. **Build Projects** — Apply what you learn to real apps\n6. **Version Control** — Learn Git/GitHub early\n7. **Competitive Programming** — Improves problem-solving speed",

    "cgpa": "📊 **CGPA Improvement Tips:**\n\n1. Attend all lectures and labs\n2. Submit assignments on time\n3. Participate in class discussions\n4. Focus on internal assessments — they add up\n5. Study consistently, not just before exams\n6. Seek help from professors during office hours\n7. Use the 4-year planner to track your progress\n8. Balance academic and extracurricular activities",

    "stress": "🧘 **Managing Stress & Mental Health:**\n\n1. **Exercise Regularly** — Even 20 min walks help\n2. **Stay Hydrated** — Track water intake daily\n3. **Practice Gratitude** — Use the gratitude journal here\n4. **Take Breaks** — Don't study for hours without rest\n5. **Talk to Someone** — Friends, family, or counselors\n6. **Sleep Schedule** — Consistent bedtime and wake time\n7. **Hobbies** — Make time for things you enjoy\n8. **Digital Detox** — Limit social media before bed",

    "internship": "🏢 **Internship Guide:**\n\n1. **When to Apply** — Start looking in Year 2, Semester 3-4\n2. **Resume** — Highlight projects, skills, and coursework\n3. **Portfolio** — Create a GitHub portfolio with 3-5 projects\n4. **Platforms** — LinkedIn, Internshala, AngelList, company career pages\n5. **Cold Emailing** — Reach out to professionals directly\n6. **Interview Prep** — Practice aptitude + technical + HR questions\n7. **Networking** — Attend campus placement talks",

    "projects": "🔧 **Project Ideas for Engineering Students:**\n\n1. **Web App** — Full-stack CRUD application\n2. **Mobile App** — React Native or Flutter app\n3. **ML Project** — Prediction model or NLP chatbot\n4. **IoT** — Smart home automation system\n5. **Robotics** — Arduino/Raspberry Pi based robot\n6. **Blockchain** — Decentralized application (DApp)\n7. **Game** — 2D/3D game using Unity or Godot\n8. **Open Source** — Contribute to existing projects on GitHub",

    "hello": "👋 Hey there! I'm your study buddy chatbot. I can help you with:\n\n• 📚 Study tips\n• 📋 Semester preparation\n• 💼 Career guidance\n• ⏰ Time management\n• 📝 Exam preparation\n• 💻 Coding & DSA tips\n• 📊 CGPA improvement\n• 🧘 Stress management\n• 🏢 Internship guide\n• 🔧 Project ideas\n\nJust type a keyword or ask me anything!",

    "hi": "👋 Hey there! I'm your study buddy chatbot. I can help you with:\n\n• 📚 Study tips\n• 📋 Semester preparation\n• 💼 Career guidance\n• ⏰ Time management\n• 📝 Exam preparation\n• 💻 Coding & DSA tips\n• �� CGPA improvement\n• 🧘 Stress management\n• 🏢 Internship guide\n• 🔧 Project ideas\n\nJust type a keyword or ask me anything!",
}

DEFAULT_RESPONSE = "🤔 I'm not sure about that one! Try asking about:\n\n• Study tips\n• Semester prep\n• Career guidance\n• Time management\n• Exam preparation\n• Coding tips\n• CGPA improvement\n• Stress management\n• Internship guide\n• Project ideas\n\nOr just say **hi** to see what I can do!"


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/quote')
def get_quote():
    quote = random.choice(QUOTES)
    return jsonify(quote)


@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message', '').lower().strip()

    response = DEFAULT_RESPONSE
    for keyword, answer in CHATBOT_KB.items():
        if keyword in message:
            response = answer
            break

    return jsonify({"response": response})


@app.route('/api/upload-photo', methods=['POST'])
def upload_photo():
    if 'photo' in request.files:
        photo = request.files['photo']
        if photo.filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"photo_{timestamp}_{photo.filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            photo.save(filepath)
            return jsonify({"success": True, "filename": filename, "url": f"/static/uploads/{filename}"})
    
    # Handle base64 image from photobooth
    data = request.get_json()
    if data and 'image' in data:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"photobooth_{timestamp}.png"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        img_data = data['image'].split(',')[1] if ',' in data['image'] else data['image']
        with open(filepath, 'wb') as f:
            f.write(base64.b64decode(img_data))
        
        return jsonify({"success": True, "filename": filename, "url": f"/static/uploads/{filename}"})
    
    return jsonify({"success": False, "error": "No photo provided"}), 400


@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'true').lower() == 'true'
    app.run(debug=debug, host='0.0.0.0', port=port)
