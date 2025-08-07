import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { Assessment } from '@/lib/supabase/types'

interface ExportRequest {
  assessmentId: string
  format: 'pdf' | 'csv'
}

export async function POST(request: NextRequest) {
  try {
    const { assessmentId, format }: ExportRequest = await request.json()

    if (!assessmentId || !format) {
      return NextResponse.json(
        { error: 'Assessment ID and format are required' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch assessment data
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .eq('user_id', user.id)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    // Ensure assessment is completed
    if (assessment.status !== 'completed') {
      return NextResponse.json(
        { error: 'Only completed assessments can be exported' },
        { status: 400 }
      )
    }

    if (format === 'pdf') {
      return await generatePDFExport(assessment)
    } else if (format === 'csv') {
      return await generateCSVExport(assessment)
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Use pdf or csv' },
        { status: 400 }
      )
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generatePDFExport(assessment: Assessment): Promise<NextResponse> {
  // For now, we'll create a simple text-based "PDF" as a placeholder
  // In production, you would use a library like puppeteer, jsPDF, or similar
  
  const reportContent = generateReportContent(assessment)
  
  // Create a simple text file as placeholder for PDF
  const buffer = Buffer.from(reportContent, 'utf-8')
  
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="assessment-${assessment.type}-${new Date(assessment.created_at).toISOString().split('T')[0]}.pdf"`,
      'Content-Length': buffer.length.toString(),
    },
  })
}

async function generateCSVExport(assessment: Assessment): Promise<NextResponse> {
  const csvContent = generateCSVContent(assessment)
  const buffer = Buffer.from(csvContent, 'utf-8')
  
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="assessment-${assessment.type}-${new Date(assessment.created_at).toISOString().split('T')[0]}.csv"`,
      'Content-Length': buffer.length.toString(),
    },
  })
}

function generateReportContent(assessment: Assessment): string {
  const createdDate = new Date(assessment.created_at).toLocaleDateString('pt-BR')
  const completedDate = assessment.completed_at ? new Date(assessment.completed_at).toLocaleDateString('pt-BR') : 'N/A'
  
  return `
RELATÓRIO DE AVALIAÇÃO
=====================

Informações Gerais:
- ID: ${assessment.id}
- Tipo: ${getTypeLabel(assessment.type)}
- Status: ${getStatusLabel(assessment.status)}
- Data de Criação: ${createdDate}
- Data de Conclusão: ${completedDate}

Resultados:
${formatResults(assessment)}

---
Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
Soyuz Interface - Sistema de Avaliações
  `.trim()
}

function generateCSVContent(assessment: Assessment): string {
  const headers = ['ID', 'Tipo', 'Status', 'Data_Criacao', 'Data_Conclusao', 'Resultados']
  
  const createdDate = new Date(assessment.created_at).toISOString().split('T')[0]
  const completedDate = assessment.completed_at ? new Date(assessment.completed_at).toISOString().split('T')[0] : ''
  
  const row = [
    assessment.id,
    getTypeLabel(assessment.type),
    getStatusLabel(assessment.status),
    createdDate,
    completedDate,
    JSON.stringify(getAssessmentResults(assessment) || {}).replace(/"/g, '""') // Escape quotes for CSV
  ]
  
  return [headers.join(','), row.map(field => `"${field}"`).join(',')].join('\n')
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    complete: 'Completa',
    disc: 'DISC',
    soft_skills: 'Soft Skills',
    sjt: 'SJT'
  }
  return labels[type] || type
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    completed: 'Concluída',
    in_progress: 'Em andamento'
  }
  return labels[status] || status
}

function getAssessmentResults(assessment: Assessment): any {
  switch (assessment.type) {
    case 'disc':
      return assessment.disc_results
    case 'soft_skills':
      return assessment.soft_skills_results
    case 'sjt':
      return assessment.sjt_results
    default:
      return {
        disc_results: assessment.disc_results,
        soft_skills_results: assessment.soft_skills_results,
        sjt_results: assessment.sjt_results
      }
  }
}

function formatResults(assessment: Assessment): string {
  const results = getAssessmentResults(assessment)
  if (!results) return 'Nenhum resultado disponível'
  
  try {
    return JSON.stringify(results, null, 2)
  } catch {
    return 'Erro ao formatar resultados'
  }
} 