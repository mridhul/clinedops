import { Button, Card, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useLogin } from '../api/auth'
import { useAuth } from '../auth/useAuth'
import type { MeResponse } from '../types/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAccessToken = useAuth((s) => s.setAccessToken)
  const setProfile = useAuth((s) => s.setProfile)

  const loginMutation = useLogin()
  const [submitError, setSubmitError] = useState<string | null>(null)

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          Sign in
        </Typography.Title>

        <Form
          layout="vertical"
          onFinish={async (values: { email: string; password: string }) => {
            setSubmitError(null)
            try {
              const res = await loginMutation.mutateAsync(values)
              setAccessToken(res.access_token)

              const profile: MeResponse = {
                id: 'unknown',
                email: values.email,
                full_name: null,
                role: res.role,
                discipline: res.discipline,
              }
              setProfile(profile)

              navigate('/dashboard', { replace: true })
            } catch {
              setSubmitError('Invalid email or password')
            }
          }}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
          >
            <Input autoComplete="email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, min: 8, message: 'Password must be at least 8 characters' }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>

          {submitError ? (
            <Typography.Text type="danger" style={{ display: 'block', marginBottom: 12 }}>
              {submitError}
            </Typography.Text>
          ) : null}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loginMutation.isPending}
              style={{ width: '100%' }}
            >
              Login
            </Button>
          </Form.Item>

          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Demo password: <b>DemoPassword1!</b>
          </Typography.Paragraph>
        </Form>
      </Card>
    </div>
  )
}

