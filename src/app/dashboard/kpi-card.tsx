import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FC } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const KPICard: FC<{title: string; value: string | number | undefined; icon: React.ElementType; loading?: boolean; description?: string, textBreak?: boolean, tooltipText?: string}> = ({ title, value, icon: Icon, loading, description, textBreak = false, tooltipText }) => {
    const cardContent = (
        <Card className="relative overflow-hidden h-full">
            <div className="absolute top-0 left-0 h-1 w-full bg-[#548118]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-3/4" /> : <div className={`text-2xl font-bold ${textBreak ? 'break-words' : ''}`}>{value}</div>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </CardContent>
        </Card>
    );

    if (tooltipText) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {cardContent}
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tooltipText}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    
    return cardContent;
};
