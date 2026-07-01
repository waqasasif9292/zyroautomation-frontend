<template>
  <div class="auth-layout">
    <div class="auth-brand-panel">
      <div class="auth-brand-copy">
        <h1 class="text-4xl font-bold mb-4">Zyro Automation</h1>
        <p class="text-xl text-blue-200 mb-12">Smart Order Management</p>
        <div class="brand-mark"></div>
      </div>
    </div>

    <div class="auth-form-panel">
      <div class="auth-card">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100dvh;
  display: flex;
  background: #f8fafc;
}

.auth-brand-panel {
  width: 40%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #172554;
  color: #fff;
  padding: 32px;
}

.auth-brand-copy {
  text-align: center;
}

.brand-mark {
  width: 192px;
  height: 192px;
  margin: 0 auto;
  border-radius: 8px;
  background: #1e40af;
}

.auth-form-panel {
  width: 60%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 448px;
  border-radius: 16px;
  background: #fff;
  padding: 32px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
}

@media (max-width: 768px) {
  .auth-layout {
    display: block;
    min-height: 100dvh;
    padding: 18px;
    background:
      linear-gradient(180deg, rgba(23, 37, 84, 0.92) 0 168px, transparent 168px),
      #f8fafc;
  }

  .auth-brand-panel {
    width: 100%;
    min-height: 132px;
    display: flex;
    background: transparent;
    padding: 8px 0 18px;
  }

  .auth-brand-copy h1 {
    margin-bottom: 4px;
    font-size: 26px;
  }

  .auth-brand-copy p {
    margin-bottom: 0;
    font-size: 14px;
  }

  .brand-mark {
    display: none;
  }

  .auth-form-panel {
    width: 100%;
    display: block;
    padding: 0;
  }

  .auth-card {
    max-width: none;
    border-radius: 12px;
    padding: 22px;
  }
}

@media (max-width: 380px) {
  .auth-layout {
    padding: 12px;
  }

  .auth-card {
    padding: 18px;
  }
}
</style>
