<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Left Panel - Branding (Hidden on mobile) -->
    <div class="hidden md:flex md:w-2/5 bg-blue-900 text-white flex-col justify-center items-center p-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold mb-4">Zyro Automation</h1>
        <p class="text-xl text-blue-200 mb-12">Smart Order Management</p>
        <div class="w-48 h-48 bg-blue-800 rounded-lg mx-auto"></div>
      </div>
    </div>

    <!-- Right Panel - Form -->
    <div class="w-full md:w-3/5 flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
