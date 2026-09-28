import './styles.css';
import { Placement } from './game/types';
import { renderBattle } from './ui/battle';
import { renderLanding } from './ui/landing';
import { renderSetup } from './ui/setup';

function startLanding(): void {
  renderLanding(startSetup);
}

function startSetup(): void {
  renderSetup((placements: Placement[]) => renderBattle(placements, startSetup));
}

startLanding();
