/**
 * Floating Damage/Block Numbers Component
 * 
 * Displays temporary floating numbers above units when
 * damage is dealt or block is gained.
 */

import React, { useEffect, useState } from 'react';
import { ANIMATION_TIMING, FloatingNumber, isFloatingNumberVisible } from '../animations';

interface FloatingNumbersProps {
    numbers: FloatingNumber[];
    onRemove: (id: string) => void;
}

export const FloatingNumbers: React.FC<FloatingNumbersProps> = ({ numbers, onRemove }) => {
    // Auto-cleanup expired numbers
    useEffect(() => {
        const interval = setInterval(() => {
            numbers.forEach(num => {
                if (!isFloatingNumberVisible(num)) {
                    onRemove(num.id);
                }
            });
        }, 50);

        return () => clearInterval(interval);
    }, [numbers, onRemove]);

    return (
        <>
            {numbers.map((num, index) => (
                <div
                    key={num.id}
                    className={`floating-number ${num.color}`}
                    style={{
                        // Stagger multiple numbers slightly
                        animationDelay: `${index * 30}ms`,
                        top: `${-10 - index * 15}px`,
                    }}
                >
                    {num.color === 'damage' ? '-' : '+'}
                    {num.value}
                </div>
            ))}
        </>
    );
};

// Hook for managing floating numbers on a unit
export function useFloatingNumbers() {
    const [numbers, setNumbers] = useState<FloatingNumber[]>([]);

    const addNumber = (value: number, color: FloatingNumber['color']) => {
        const newNum: FloatingNumber = {
            id: `float_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            value,
            color,
            startTime: Date.now(),
        };
        setNumbers(prev => [...prev, newNum]);
    };

    const removeNumber = (id: string) => {
        setNumbers(prev => prev.filter(n => n.id !== id));
    };

    return { numbers, addNumber, removeNumber };
}
