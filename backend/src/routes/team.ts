import express from 'express'
import { authenticateToken } from '../middleware/auth'
import { supabase } from '../config/supabase'

const router = express.Router()

// GET /api/team - Get all team members
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select(`
        *,
        user_roles!inner(role_name),
        user_stats(tickets_resolved, avg_response_time, satisfaction_score)
      `)
      .eq('organization_id', req.user.organizationId)

    if (error) throw error

    // Transform data to match frontend expectations
    const transformedMembers = teamMembers?.map(member => ({
      id: member.id,
      name: member.full_name,
      email: member.email,
      role: member.user_roles.role_name,
      status: member.is_online ? 'online' : 'offline',
      lastActive: new Date(member.last_active_at),
      joinDate: new Date(member.created_at),
      permissions: member.permissions || [],
      expertise: member.expertise_areas || [],
      workload: member.current_workload || 0,
      stats: member.user_stats?.[0] || {
        ticketsResolved: 0,
        avgResponseTime: '0h',
        satisfaction: 0
      }
    })) || []

    res.json({ teamMembers: transformedMembers })
  } catch (error) {
    console.error('Error fetching team members:', error)
    res.status(500).json({ error: 'Failed to fetch team members' })
  }
})

// POST /api/team - Create new team member
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, email, role, expertise } = req.body

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('team_members')
      .select('id')
      .eq('email', email)
      .eq('organization_id', req.user.organizationId)
      .single()

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Create new team member
    const { data: newMember, error } = await supabase
      .from('team_members')
      .insert({
        full_name: name,
        email,
        organization_id: req.user.organizationId,
        role_id: role === 'admin' ? 1 : role === 'manager' ? 2 : 3, // Map roles to IDs
        expertise_areas: expertise || [],
        is_online: false,
        last_active_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      id: newMember.id,
      name: newMember.full_name,
      email: newMember.email,
      role,
      status: 'offline',
      lastActive: new Date(),
      joinDate: new Date(newMember.created_at),
      permissions: [],
      expertise: expertise || [],
      workload: 0,
      stats: {
        ticketsResolved: 0,
        avgResponseTime: '0h',
        satisfaction: 0
      }
    })
  } catch (error) {
    console.error('Error creating team member:', error)
    res.status(500).json({ error: 'Failed to create team member' })
  }
})

// PUT /api/team/:id - Update team member
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { name, role, expertise, status } = req.body

    const updateData: any = {}
    if (name) updateData.full_name = name
    if (role) updateData.role_id = role === 'admin' ? 1 : role === 'manager' ? 2 : 3
    if (expertise) updateData.expertise_areas = expertise
    if (status) updateData.is_online = status === 'online'

    const { data: updatedMember, error } = await supabase
      .from('team_members')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .select(`
        *,
        user_roles!inner(role_name),
        user_stats(tickets_resolved, avg_response_time, satisfaction_score)
      `)
      .single()

    if (error) throw error

    res.json({
      id: updatedMember.id,
      name: updatedMember.full_name,
      email: updatedMember.email,
      role: updatedMember.user_roles.role_name,
      status: updatedMember.is_online ? 'online' : 'offline',
      lastActive: new Date(updatedMember.last_active_at),
      joinDate: new Date(updatedMember.created_at),
      permissions: updatedMember.permissions || [],
      expertise: updatedMember.expertise_areas || [],
      workload: updatedMember.current_workload || 0,
      stats: updatedMember.user_stats?.[0] || {
        ticketsResolved: 0,
        avgResponseTime: '0h',
        satisfaction: 0
      }
    })
  } catch (error) {
    console.error('Error updating team member:', error)
    res.status(500).json({ error: 'Failed to update team member' })
  }
})

// DELETE /api/team/:id - Remove team member
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)

    if (error) throw error

    res.json({ message: 'Team member removed successfully' })
  } catch (error) {
    console.error('Error removing team member:', error)
    res.status(500).json({ error: 'Failed to remove team member' })
  }
})

// GET /api/team/stats - Get team statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { data: stats, error } = await supabase
      .from('team_stats')
      .select('*')
      .eq('organization_id', req.user.organizationId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error
    }

    const defaultStats = {
      totalMembers: 0,
      activeTickets: 0,
      avgResponseTime: '0h',
      satisfactionScore: 0,
      systemHealth: 85
    }

    res.json(stats || defaultStats)
  } catch (error) {
    console.error('Error fetching team stats:', error)
    res.status(500).json({ error: 'Failed to fetch team statistics' })
  }
})

// POST /api/team/:id/workload - Update team member workload
router.post('/:id/workload', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { workload } = req.body

    const { error } = await supabase
      .from('team_members')
      .update({ current_workload: Math.max(0, Math.min(100, workload)) })
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)

    if (error) throw error

    res.json({ message: 'Workload updated successfully' })
  } catch (error) {
    console.error('Error updating workload:', error)
    res.status(500).json({ error: 'Failed to update workload' })
  }
})

export default router
