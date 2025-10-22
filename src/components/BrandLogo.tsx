interface BrandLogoProps {
  variant: 'full' | 'mark'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: { height: 'h-5', width: 'w-auto' }, // 20px height
  md: { height: 'h-6', width: 'w-auto' }, // 24px height  
  lg: { height: 'h-7', width: 'w-auto' }, // 28px height
  xl: { height: 'h-8', width: 'w-auto' }, // 32px height
}

const variantMap = {
  full: '/brand/planright-logo.png',
  mark: '/brand/planright-logo.png',
}

export default function BrandLogo({ 
  variant, 
  size = 'md', 
  className = '' 
}: BrandLogoProps) {
  const sizeClasses = sizeMap[size]
  
  return (
    <img
      src={variantMap[variant]}
      alt="PlanRight"
      className={`${sizeClasses.height} ${sizeClasses.width} max-w-none ${className}`}
    />
  )
}
