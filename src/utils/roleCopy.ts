/**
 * Role-aware copy and behavior system for PlanRight.
 * Adapts tone, detail level, and guidance based on user role.
 */

export type UserRole = 'Resident' | 'Builder' | 'Purchaser' | 'Planner' | 'Student'

export interface RoleCopy {
  tone: string
  detailLevel: 'basic' | 'intermediate' | 'advanced'
  guidance: {
    explanations: string[]
    nextSteps: string[]
  }
}

const ROLE_COPY: Record<UserRole, RoleCopy> = {
  Resident: {
    tone: 'friendly, straightforward, practical',
    detailLevel: 'basic',
    guidance: {
      explanations: [
        'Building line is usually 5m from the street',
        'Setbacks keep your structure away from boundaries',
        'Easements are areas where utilities have rights',
        'Heritage areas have special rules'
      ],
      nextSteps: [
        'Check with council if unsure',
        'Get a survey if needed',
        'Consider hiring a builder for complex projects'
      ]
    }
  },
  
  Builder: {
    tone: 'professional, technical, solution-focused',
    detailLevel: 'intermediate',
    guidance: {
      explanations: [
        'SEPP Part 2 Subdivision 6/9/10 apply',
        'Building line typically 5m from frontage',
        'Minimum setbacks: 0.9m side/rear, 5m front',
        'Heritage/conservation areas require additional approvals'
      ],
      nextSteps: [
        'Review DCP Part 10 for siting guidance',
        'Check with council for complex sites',
        'Consider complying development if exempt fails',
        'Document all measurements for client'
      ]
    }
  },
  
  Purchaser: {
    tone: 'cautious, risk-aware, decision-supporting',
    detailLevel: 'intermediate',
    guidance: {
      explanations: [
        'This assessment is preliminary only',
        'Council approval may still be required',
        'Property constraints can change',
        'Consider resale implications'
      ],
      nextSteps: [
        'Get professional planning advice',
        'Request council pre-lodgement meeting',
        'Consider development application if needed',
        'Factor approval costs into purchase decision'
      ]
    }
  },
  
  Planner: {
    tone: 'technical, precise, regulation-focused',
    detailLevel: 'advanced',
    guidance: {
      explanations: [
        'SEPP (Exempt Development) 2008 Part 2 Subdivisions 6, 9, 10',
        'Building line defined in LEP/DCP',
        'Setback requirements vary by zone',
        'Heritage/conservation overlays override exempt status'
      ],
      nextSteps: [
        'Review full SEPP text for edge cases',
        'Check DCP Part 10 for siting guidance',
        'Consider precedent decisions',
        'Document assessment for file'
      ]
    }
  },
  
  Student: {
    tone: 'educational, explanatory, learning-focused',
    detailLevel: 'basic',
    guidance: {
      explanations: [
        'SEPP = State Environmental Planning Policy',
        'Exempt development doesn\'t need approval',
        'Setbacks protect neighbors and services',
        'Different rules apply to different structure types'
      ],
      nextSteps: [
        'Read SEPP (Exempt Development) 2008',
        'Study local DCP requirements',
        'Practice with planning software',
        'Shadow experienced planners'
      ]
    }
  }
}


export function getRoleSpecificExplanation(role: UserRole, topic: string): string {
  const copy = ROLE_COPY[role]
  
  switch (topic) {
    case 'building_line':
      switch (role) {
        case 'Resident': return 'The building line is usually 5m from the street. Your structure must be behind this line.'
        case 'Builder': return 'Building line typically 5m from frontage. Check DCP for variations.'
        case 'Purchaser': return 'Building line restrictions affect development potential. Verify with council.'
        case 'Planner': return 'Building line defined in LEP/DCP. Standard is 5m from frontage.'
        case 'Student': return 'Building line is a planning control that keeps buildings away from streets.'
      }
    case 'setbacks':
      switch (role) {
        case 'Resident': return 'Setbacks keep your structure away from boundaries and neighbors.'
        case 'Builder': return 'Minimum setbacks: 0.9m side/rear, 5m front (behind building line).'
        case 'Purchaser': return 'Setback requirements limit where structures can be built.'
        case 'Planner': return 'Setback requirements vary by zone and structure type per SEPP.'
        case 'Student': return 'Setbacks are minimum distances from property boundaries.'
      }
    case 'easements':
      switch (role) {
        case 'Resident': return 'Easements are areas where utilities have rights. Avoid building there.'
        case 'Builder': return 'Check easement locations on survey. Structures cannot be built on easements.'
        case 'Purchaser': return 'Easements limit development options. Check property title.'
        case 'Planner': return 'Easements are registered interests. SEPP prohibits development on easements.'
        case 'Student': return 'Easements are areas where utilities have legal rights to access.'
      }
    case 'heritage':
      switch (role) {
        case 'Resident': return 'Heritage areas have special rules. Check with council first.'
        case 'Builder': return 'Heritage/conservation overlays require additional approvals.'
        case 'Purchaser': return 'Heritage restrictions can significantly limit development.'
        case 'Planner': return 'Heritage/conservation overlays override exempt development status.'
        case 'Student': return 'Heritage areas have special planning controls to protect character.'
      }
    default:
      return copy.guidance.explanations[0]
  }
}

export function getRoleSpecificNextSteps(role: UserRole, hasFailures: boolean): string[] {
  const copy = ROLE_COPY[role]
  
  if (!hasFailures) {
    switch (role) {
      case 'Resident': return ['You can proceed with construction', 'No additional approvals needed']
      case 'Builder': return ['Proceed with construction', 'Document compliance for client']
      case 'Purchaser': return ['Development appears feasible', 'Consider professional verification']
      case 'Planner': return ['Assessment complete', 'Document for file']
      case 'Student': return ['Good example of exempt development', 'Study the requirements']
    }
  }
  
  return copy.guidance.nextSteps
}
