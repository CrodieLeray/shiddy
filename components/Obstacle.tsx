"use client"

import React from 'react';

const Obstacle = ({ position }: { position: number }) => {
  return (
    <div
      className="absolute bottom-4 h-12 w-6 bg-red-500"
      style={{ right: `${position}px` }}
    />
  );
};

export default Obstacle;
