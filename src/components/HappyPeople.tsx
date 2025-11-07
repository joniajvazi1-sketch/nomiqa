import { useEffect, useState } from "react";

const happyEmojis = ['👋', '🎉', '😊', '🌟', '✨', '🎊', '🙌', '💫'];

export const HappyPeople = () => {
  const [people, setPeople] = useState<Array<{ id: number; emoji: string; left: number; bottom: number }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newPerson = {
        id: Date.now(),
        emoji: happyEmojis[Math.floor(Math.random() * happyEmojis.length)],
        left: Math.random() * 90 + 5, // 5% to 95%
        bottom: -10,
      };
      
      setPeople(prev => [...prev, newPerson]);
      
      setTimeout(() => {
        setPeople(prev => prev.filter(p => p.id !== newPerson.id));
      }, 4000);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {people.map((person) => (
        <div
          key={person.id}
          className="absolute text-4xl animate-wave-up"
          style={{
            left: `${person.left}%`,
            bottom: `${person.bottom}%`,
          }}
        >
          {person.emoji}
        </div>
      ))}
    </div>
  );
};
