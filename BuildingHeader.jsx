import React from 'react';
import { MapPin, Mountain, Ruler, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const difficultyStyles = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  advanced: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  expert: 'bg-red-500/20 text-red-400 border-red-500/30',
  legendary: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export default function BuildingHeader({ building }) {
  return (
    <div className="relative">
      {building.image_url ? (
        <div className="h-64 md:h-80 relative overflow-hidden">
          <img src={building.image_url} alt={building.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
      ) : (
        <div className="h-48 md:h-64 bg-gradient-to-br from-primary/10 via-card to-accent/10" />
      )}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Map
          </Button>
        </Link>
        <h1 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2">
          {building.name}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {building.city}{building.country ? `, ${building.country}` : ''}
          </span>
          {building.floors && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Mountain className="w-4 h-4" /> {building.floors} Floors
            </span>
          )}
          {building.height_meters && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Ruler className="w-4 h-4" /> {building.height_meters}m
            </span>
          )}
          {building.difficulty && (
            <Badge variant="outline" className={difficultyStyles[building.difficulty]}>
              {building.difficulty}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
