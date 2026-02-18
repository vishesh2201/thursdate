import { useState, useMemo } from "react";

// Define the quiz questions
const quizQuestions = [
  {
    id: "sportsPersonality",
    question: "Which sports best reflects your personality?",
    type: "tags",
    placeholder: "e.g., Tennis, Formula 1, Football",
    minAnswers: 1,
    description: "Enter as many as you want",
  },
  {
    id: "sportsLegend",
    question: "If you could train with a sports legend for a day, who would it be?",
    type: "tags",
    placeholder: "e.g., Roger Federer, Michael Jordan",
    minAnswers: 1,
    description: "Enter as many as you want",
  },
  {
    id: "greenFlags",
    question: "What's the biggest green flag in a partner?",
    type: "multiple",
    description: "Select as many as you want",
    options: [
      { text: "Can make me laugh till I snort", value: "laugh" },
      { text: "They know exactly where to kiss", value: "kiss" },
      { text: "Texts back fast", value: "texts_back_fast" },
      { text: "Good with their hands", value: "good_with_hands" },
    ],
  },
  {
    id: "pushpa2",
    question: "Seen Pushpa 2 yet or still under a rock?",
    type: "single",
    image: "/pushpa.png",
    options: [
      { text: "FDFS, Pushpa fire!", value: "seen_fdfs" },
      { text: "Waiting for the right vibe", value: "waiting" },
      { text: "Bruh, still on part 1", value: "part1" },
      { text: "Not interested", value: "not_interested" },
    ],
  },
  {
    id: "socialRitual",
    question: "Pick your go-to social ritual:",
    type: "single",
    options: [
      { text: "Coffee catch-ups and deep convos", value: "coffee_convo" },
      { text: "A glass of wine (or three) with friends", value: "wine_friends" },
      { text: "A smoke break that turns into a life talk", value: "smoke_life_talk" },
      { text: "Whatever's passed around the table", value: "whatever" },
    ],
  },
  {
    id: "fridayNight",
    question: "What’s your idea of a perfect Friday night?",
    type: "single",
    options: [
      { text: "A chill night with a book or Netflix", value: "chill_night" },
      { text: "A house party with good vibes & great drinks", value: "house_party" },
      { text: "Bar hopping", value: "bar_hopping" },
      { text: "Whatever the universe throws at me", value: "spontaneous" },
    ],
  },
  {
    id: "soundsLikeYou",
    question: "Which one sounds most like you?",
    type: "single",
    options: [
      { text: "Water is life.", value: "water" },
      { text: "A little liquid courage never hurt anyone.", value: "liquid_courage" },
      { text: "I like my air.. enhanced.", value: "enhanced_air" },
      { text: "Let's just say I have eclectic tastes.", value: "eclectic_tastes" },
    ],
  },
  {
    id: "iconicMoments",
    question: "Which of these iconic moments do you love most?",
    type: "imageSingle",
    options: [
      { text: "Seven seven seven!", value: "seven", image: "/monica.png" },
      { text: "How you doin'?", value: "how_you_doin", image: "/joey.png" },
      { text: "Pivot pivot pivot!", value: "pivot", image: "/ross.png" },
      { text: "They don't know that we know that they know that we know!", value: "they_know", image: "/pheobe.png" },
    ],
  },
  {
    id: "mellowVibes",
    question: "When you hear 'mellow vibes,' what do you think of?",
    type: "single",
    options: [
      { text: "A cozy blanket and a good playlist", value: "blanket_playlist" },
      { text: "A smooth cocktail and dim lighting", value: "cocktail_lighting" },
      { text: "A slow exhale and deep thoughts", value: "deep_thoughts" },
      { text: "The kind of relaxation that's out of this world", value: "out_of_this_world" },
    ],
  },
  {
    id: "takingTheEdgeOff",
    question: "What's your version of 'taking the edge off' after a long day?",
    type: "single",
    options: [
      { text: "A hot shower and sleep", value: "shower_sleep" },
      { text: "A happy hour special", value: "happy_hour" },
      { text: "A smoke and some fresh air", value: "smoke_air" },
      { text: "Something that makes reality a little more fun", value: "more_fun" },
    ],
  },
];

export default function GameTab() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const totalSteps = quizQuestions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const currentQuestion = quizQuestions[currentStep];

  const handleNext = () => {
    const currentAnswer = answers[currentQuestion.id];
    const isAnswered = currentAnswer && (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : currentAnswer.length > 0);

    if (!isAnswered) {
      alert("Please select an answer to continue.");
      return;
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      alert("Quiz Finished! Your answers: " + JSON.stringify(answers));
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: value,
    }));
  };

  // Handlers for tag-based inputs
  const [currentTagInput, setCurrentTagInput] = useState("");
  const handleAddTag = (e) => {
    if (e.key === 'Enter' && currentTagInput.trim() !== '') {
      const newTag = currentTagInput.trim();
      setAnswers(prevAnswers => {
        const existingTags = prevAnswers[currentQuestion.id] || [];
        if (!existingTags.includes(newTag)) {
          return {
            ...prevAnswers,
            [currentQuestion.id]: [...existingTags, newTag],
          };
        }
        return prevAnswers;
      });
      setCurrentTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setAnswers(prevAnswers => {
      const existingTags = prevAnswers[currentQuestion.id] || [];
      return {
        ...prevAnswers,
        [currentQuestion.id]: existingTags.filter(tag => tag !== tagToRemove),
      };
    });
  };

  const isNextDisabled = useMemo(() => {
    const currentAnswer = answers[currentQuestion.id];
    if (currentQuestion.type === "tags") {
      return !currentAnswer || currentAnswer.length < currentQuestion.minAnswers;
    } else if (currentQuestion.type === "multiple") {
      return !currentAnswer || currentAnswer.length === 0;
    }
    return !currentAnswer;
  }, [answers, currentQuestion]);

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case "single":
        return (
          <div className="flex flex-col gap-3">
            {currentQuestion.options.map(option => (
              <label
                key={option.value}
                className={`flex items-center justify-between border rounded-lg px-4 py-3 cursor-pointer transition-all ${
                  answers[currentQuestion.id] === option.value
                    ? "border-[#222222] bg-gray-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex-1 pr-4">{option.text}</div>
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option.value}
                  checked={answers[currentQuestion.id] === option.value}
                  onChange={() => handleAnswerChange(currentQuestion.id, option.value)}
                  className="accent-[#222222] w-5 h-5"
                />
              </label>
            ))}
          </div>
        );
      case "imageSingle":
        return (
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.options.map(option => (
              <label
                key={option.value}
                className={`flex flex-col items-center justify-between border rounded-lg p-2 cursor-pointer transition-all ${
                  answers[currentQuestion.id] === option.value
                    ? "border-[#222222] bg-gray-50"
                    : "border-gray-200"
                }`}
              >
                <img src={option.image} alt={option.text} className="w-full h-auto object-cover rounded-md mb-2" />
                <div className="text-center text-xs flex-1">{option.text}</div>
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option.value}
                  checked={answers[currentQuestion.id] === option.value}
                  onChange={() => handleAnswerChange(currentQuestion.id, option.value)}
                  className="accent-[#222222] w-4 h-4 mt-2"
                />
              </label>
            ))}
          </div>
        );
      case "multiple":
        return (
          <div className="flex flex-col gap-3">
            {currentQuestion.options.map(option => (
              <label
                key={option.value}
                className={`flex items-center justify-between border rounded-lg px-4 py-3 cursor-pointer transition-all ${
                  answers[currentQuestion.id]?.includes(option.value)
                    ? "border-[#222222] bg-gray-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex-1 pr-4">{option.text}</div>
                <input
                  type="checkbox"
                  name={currentQuestion.id}
                  value={option.value}
                  checked={answers[currentQuestion.id]?.includes(option.value) || false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAnswers(prevAnswers => {
                      const currentSelection = prevAnswers[currentQuestion.id] || [];
                      if (checked) {
                        return { ...prevAnswers, [currentQuestion.id]: [...currentSelection, option.value] };
                      } else {
                        return { ...prevAnswers, [currentQuestion.id]: currentSelection.filter(val => val !== option.value) };
                      }
                    });
                  }}
                  className="accent-[#222222] w-5 h-5"
                />
              </label>
            ))}
          </div>
        );
      case "tags":
        return (
          <div className="flex flex-col">
            <div className="flex flex-wrap gap-2 mb-4">
              {(answers[currentQuestion.id] || []).map((tag, index) => (
                <div
                  key={index}
                  className="bg-[#222222] text-white px-3 py-2 rounded-lg flex items-center text-sm"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-white opacity-70 hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="relative mb-6">
              <input
                type="text"
                value={currentTagInput}
                onChange={(e) => setCurrentTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={currentQuestion.placeholder}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm pr-10"
              />
              {currentTagInput && (
                <button
                  onClick={() => setCurrentTagInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col font-sans pb-6">
      {/* Top Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 mb-6">
        <div
          className="bg-[#222222] h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Quiz Content */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold">{currentQuestion.question}</h1>
          {currentQuestion.description && (
            <p className="text-sm text-gray-500">{currentQuestion.description}</p>
          )}
          {currentQuestion.image && (
            <img src={currentQuestion.image} alt="Question" className="rounded-lg mb-2" />
          )}
          {renderQuestion()}
        </div>

        {/* Navigation Button */}
        <button
          disabled={isNextDisabled}
          onClick={handleNext}
          className={`w-full py-4 mt-6 rounded-xl text-white font-medium text-sm ${
            isNextDisabled ? "bg-gray-300 cursor-not-allowed" : "bg-[#222222]"
          }`}
        >
          {currentStep === totalSteps - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}