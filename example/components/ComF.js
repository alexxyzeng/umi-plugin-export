import React from 'react';
function CompF() {
  return <div>Comp B</div>;
}

export default CompF;

export function Beauty1() {
  return <div>Beauty</div>;
}

// no export
export function Belle() {
  return <div>Beauty</div>;
}
