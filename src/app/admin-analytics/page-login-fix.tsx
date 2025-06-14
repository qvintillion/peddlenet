  // 🔧 ENHANCED DEBUG: Authentication with comprehensive logging
  const handleLogin = async (username: string, password: string) => {
    console.log('\n🔐 [LOGIN DEBUG] === LOGIN ATTEMPT START ===');
    console.log('[LOGIN DEBUG] Username:', username);
    console.log('[LOGIN DEBUG] Password length:', password.length);
    console.log('[LOGIN DEBUG] Timestamp:', new Date().toISOString());
    console.log('[LOGIN DEBUG] isClient:', isClient);
    console.log('[LOGIN DEBUG] hasInitialized:', hasInitialized);
    
    setIsLoading(true);
    setLoginError('');

    try {
      // 🔧 CRITICAL FIX: Set credentials FIRST, then wait for state update
      const testCredentials = { username, password };
      console.log('[LOGIN DEBUG] Setting test credentials:', testCredentials);
      setCredentials(testCredentials);
      
      // 🔧 CRITICAL FIX: Wait a bit for React state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('[LOGIN DEBUG] Making test API call to /admin/analytics...');
      
      // 🔧 CRITICAL FIX: Make API call with explicit credentials instead of relying on state
      const makeDirectAPICall = async (endpoint: string, options: RequestInit = {}) => {
        console.log('\n🔧 [DIRECT API DEBUG] === API CALL START ===');
        console.log('[DIRECT API DEBUG] Endpoint:', endpoint);
        console.log('[DIRECT API DEBUG] Options:', options);
        console.log('[DIRECT API DEBUG] Username:', username);
        console.log('[DIRECT API DEBUG] isClient:', isClient);

        if (!isClient) {
          const errorMsg = 'Not client-side';
          console.error('[DIRECT API DEBUG] Error:', errorMsg);
          throw new Error(errorMsg);
        }

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
          ...options.headers
        };

        console.log('[DIRECT API DEBUG] Headers:', headers);

        const hostname = window.location.hostname;
        const isLocal = hostname === 'localhost' || hostname.startsWith('192.168.') || hostname.startsWith('10.');
        
        const wsServer = (typeof window !== 'undefined' && (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SIGNALING_SERVER) 
          || process.env.NEXT_PUBLIC_SIGNALING_SERVER
          || 'wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app';
        
        console.log('[DIRECT API DEBUG] Environment detection:', {
          hostname,
          isLocal,
          wsServer,
          processEnv: process.env.NEXT_PUBLIC_SIGNALING_SERVER,
          windowEnv: typeof window !== 'undefined' ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SIGNALING_SERVER : 'unavailable'
        });
        
        // For staging/production, always use the WebSocket server directly
        if (!isLocal && wsServer) {
          const apiServerUrl = wsServer.replace('wss://', 'https://');
          const fullUrl = `${apiServerUrl}/admin${endpoint}`;
          console.log('[DIRECT API DEBUG] Using WebSocket server for admin API:', fullUrl);
          
          try {
            console.log('[DIRECT API DEBUG] Making fetch request...');
            const response = await fetch(fullUrl, {
              ...options,
              headers
            });
            
            console.log('[DIRECT API DEBUG] Response status:', response.status);
            console.log('[DIRECT API DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));
            console.log('[DIRECT API DEBUG] Response ok:', response.ok);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('[DIRECT API DEBUG] Response error text:', errorText);
              throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }
            
            console.log('[DIRECT API DEBUG] === API CALL SUCCESS ===\n');
            return response;
          } catch (error) {
            console.error('[DIRECT API DEBUG] WebSocket server API call failed:', error);
            throw error;
          }
        }
        
        // For local development, try both approaches
        if (isLocal) {
          console.log('[DIRECT API DEBUG] Local development detected, trying API routes...');
          
          const apiUrl = `/api/admin${endpoint}`;
          console.log('[DIRECT API DEBUG] Trying API routes:', apiUrl);
          
          try {
            const response = await fetch(apiUrl, {
              ...options,
              headers
            });
            
            console.log('[DIRECT API DEBUG] API routes response status:', response.status);
            console.log('[DIRECT API DEBUG] API routes response ok:', response.ok);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('[DIRECT API DEBUG] API routes error text:', errorText);
              throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }
            
            console.log('[DIRECT API DEBUG] API routes success!');
            console.log('[DIRECT API DEBUG] === API CALL SUCCESS ===\n');
            return response;
          } catch (error) {
            console.error('[DIRECT API DEBUG] API routes failed:', error);
            throw error;
          }
        }
        
        throw new Error('Unable to connect to admin API - no available endpoints');
      };
      
      const response = await makeDirectAPICall('/analytics');
      
      console.log('[LOGIN DEBUG] Authentication response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.ok) {
        console.log('[LOGIN DEBUG] Authentication successful!');
        setIsConnected(true);
        saveSession(username, password);
        console.log('[LOGIN DEBUG] Session saved successfully');
        console.log('[LOGIN DEBUG] === LOGIN SUCCESS ===\n');
      } else {
        console.error('[LOGIN DEBUG] Authentication failed - invalid credentials');
        setCredentials(null);
        setLoginError('Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('[LOGIN DEBUG] Authentication error:', error);
      console.error('[LOGIN DEBUG] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      setCredentials(null);
      setLoginError(`Connection error: ${error.message}. Please check your network and try again.`);
    } finally {
      setIsLoading(false);
      console.log('[LOGIN DEBUG] === LOGIN ATTEMPT END ===\n');
    }
  };